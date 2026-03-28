#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";
import { normalizeMacOuiMask, sanitizeCapturePayload } from "./live_capture_sanitizer.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "..", "..");
const OUTPUT_DIR = join(ROOT_DIR, "docs", "examples", "live-captures");
const LOCAL_CONFIG_PATH = join(ROOT_DIR, "public", "config", "pypnm-instances.local.yaml");
const TEMPLATE_CONFIG_PATH = join(ROOT_DIR, "public", "config", "pypnm-instances.yaml");

const SNMP_SPECTRUM_RETRIEVAL_TYPE = 2;

const ENDPOINTS = [
  { id: "if31-docsis-base-capability", endpointPath: "/docs/if31/docsis/baseCapability", payloadType: "device" },
  { id: "if31-ds-ofdm-channel-stats", endpointPath: "/docs/if31/ds/ofdm/chan/stats", payloadType: "device" },
  { id: "if31-ds-ofdm-profile-stats", endpointPath: "/docs/if31/ds/ofdm/profile/stats", payloadType: "device" },
  { id: "if31-system-diplexer", endpointPath: "/docs/if31/system/diplexer", payloadType: "device" },
  { id: "if31-us-ofdma-channel-stats", endpointPath: "/docs/if31/us/ofdma/channel/stats", payloadType: "device" },
  { id: "fdd-diplexer-band-edge-capability", endpointPath: "/docs/fdd/diplexer/bandEdgeCapability", payloadType: "device" },
  { id: "fdd-system-diplexer-configuration", endpointPath: "/docs/fdd/system/diplexer/configuration", payloadType: "device" },
  { id: "ds-scqam-codeword-error-rate", endpointPath: "/docs/if30/ds/scqam/chan/codewordErrorRate", payloadType: "scqamCodeword" },
  { id: "ds-scqam-channel-stats", endpointPath: "/docs/if30/ds/scqam/chan/stats", payloadType: "device" },
  { id: "atdma-pre-equalization", endpointPath: "/docs/if30/us/atdma/chan/preEqualization", payloadType: "device" },
  { id: "atdma-channel-stats", endpointPath: "/docs/if30/us/atdma/chan/stats", payloadType: "device" },
  { id: "event-log", endpointPath: "/docs/dev/eventLog", payloadType: "device" },
  { id: "interface-stats", endpointPath: "/docs/pnm/interface/stats", payloadType: "device" },
  { id: "up-time", endpointPath: "/system/upTime", payloadType: "device" },
  { id: "single-rxmer", endpointPath: "/docs/pnm/ds/ofdm/rxMer/getCapture", payloadType: "singleCapture" },
  { id: "single-channel-estimation", endpointPath: "/docs/pnm/ds/ofdm/channelEstCoeff/getCapture", payloadType: "singleCapture" },
  { id: "single-histogram", endpointPath: "/docs/pnm/ds/histogram/getCapture", payloadType: "histogram" },
  { id: "spectrum-friendly", endpointPath: "/docs/pnm/ds/spectrumAnalyzer/getCapture/friendly", payloadType: "spectrumFriendly" },
  { id: "spectrum-full-band", endpointPath: "/docs/pnm/ds/spectrumAnalyzer/getCapture/fullBandCapture", payloadType: "spectrumFullBand" },
  { id: "spectrum-ofdm", endpointPath: "/docs/pnm/ds/spectrumAnalyzer/getCapture/ofdm", payloadType: "spectrumOfdm" },
  { id: "spectrum-scqam", endpointPath: "/docs/pnm/ds/spectrumAnalyzer/getCapture/scqam", payloadType: "spectrumFriendly" },
  { id: "single-fec-summary", endpointPath: "/docs/pnm/ds/ofdm/fecSummary/getCapture", payloadType: "fecSummary" },
  { id: "single-constellation-display", endpointPath: "/docs/pnm/ds/ofdm/constellationDisplay/getCapture", payloadType: "constellation" },
  { id: "single-modulation-profile", endpointPath: "/docs/pnm/ds/ofdm/modulationProfile/getCapture", payloadType: "singleCapture" },
  { id: "single-us-ofdma-pre-equalization", endpointPath: "/docs/pnm/us/ofdma/preEqualization/getCapture", payloadType: "singleCapture" },
  { id: "system-sysdescr", endpointPath: "/system/sysDescr", payloadType: "device" },
];

const ADVANCED_WORKFLOWS = [
  {
    id: "advanced-rxmer",
    startPath: "/advance/multi/ds/rxMer/start",
    statusPath: "/advance/multi/ds/rxMer/status/{operation_id}",
    analysisPath: "/advance/multi/ds/rxMer/analysis",
    measureMode: 1,
    analysisTypes: ["min-avg-max", "rxmer-heat-map", "echo-reflection-1", "ofdm-profile-performance-1"],
  },
  {
    id: "advanced-channel-estimation",
    startPath: "/advance/multi/ds/channelEstimation/start",
    statusPath: "/advance/multi/ds/channelEstimation/status/{operation_id}",
    analysisPath: "/advance/multi/ds/channelEstimation/analysis",
    measureMode: 0,
    analysisTypes: ["min-avg-max", "group-delay", "lte-detection-phase-slope", "echo-detection-ifft"],
  },
  {
    id: "advanced-ofdma-pre-eq",
    startPath: "/advance/multi/us/ofdmaPreEqualization/start",
    statusPath: "/advance/multi/us/ofdmaPreEqualization/status/{operation_id}",
    analysisPath: "/advance/multi/us/ofdmaPreEqualization/analysis",
    measureMode: 0,
    analysisTypes: ["min-avg-max", "group-delay", "echo-detection-ifft"],
  },
];

function readRuntimeConfig() {
  try {
    return parse(readFileSync(LOCAL_CONFIG_PATH, "utf-8"));
  } catch {
    return parse(readFileSync(TEMPLATE_CONFIG_PATH, "utf-8"));
  }
}

function pickInstance(config) {
  const instances = Array.isArray(config?.instances) ? config.instances : [];
  if (!instances.length) {
    throw new Error("No instances found in runtime config.");
  }
  const selectedId = config?.defaults?.selected_instance;
  return instances.find((entry) => entry?.id === selectedId) ?? instances.find((entry) => entry?.enabled !== false) ?? instances[0];
}

function parseCliArgs(argv) {
  const args = {
    macOuiMask: "00:00:00",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--mask-mac-oui") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --mask-mac-oui");
      }
      args.macOuiMask = normalizeMacOuiMask(value);
      i += 1;
      continue;
    }
    if (current === "--help" || current === "-h") {
      process.stdout.write(
        [
          "Usage: npm run docs:capture-live-endpoint-examples -- [options]",
          "",
          "Options:",
          "  --mask-mac-oui <xx:xx:xx>  Set masked MAC OUI prefix (default: 00:00:00).",
          "  -h, --help                  Show this help.",
          "",
        ].join("\n"),
      );
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${current}`);
  }
  return args;
}

function buildPayloads(defaults) {
  const cableModemWithSnmp = {
    mac_address: defaults.macAddress,
    ip_address: defaults.ipAddress,
    snmp: {
      snmpV2C: {
        community: defaults.community,
      },
    },
  };

  const cableModemWithPnm = {
    ...cableModemWithSnmp,
    pnm_parameters: {
      tftp: {
        ipv4: defaults.tftpIpv4,
        ipv6: defaults.tftpIpv6,
      },
      capture: {
        channel_ids: [],
      },
    },
  };

  const basicAnalysis = {
    type: "basic",
    output: { type: "json" },
    plot: { ui: { theme: "dark" } },
  };

  return {
    device: {
      cable_modem: cableModemWithSnmp,
    },
    scqamCodeword: {
      cable_modem: cableModemWithSnmp,
      capture_parameters: {
        sample_time_elapsed: 5,
      },
    },
    singleCapture: {
      cable_modem: cableModemWithPnm,
      analysis: basicAnalysis,
    },
    histogram: {
      cable_modem: {
        ...cableModemWithSnmp,
        pnm_parameters: {
          tftp: {
            ipv4: defaults.tftpIpv4,
            ipv6: defaults.tftpIpv6,
          },
        },
      },
      analysis: basicAnalysis,
      capture_settings: {
        sample_duration: 10,
      },
    },
    fecSummary: {
      cable_modem: cableModemWithPnm,
      analysis: basicAnalysis,
      capture_settings: {
        fec_summary_type: 2,
      },
    },
    constellation: {
      cable_modem: cableModemWithPnm,
      analysis: {
        ...basicAnalysis,
        plot: {
          ui: { theme: "dark" },
          options: {
            display_cross_hair: true,
          },
        },
      },
      capture_settings: {
        modulation_order_offset: 0,
        number_sample_symbol: 8192,
      },
    },
    spectrumFriendly: {
      cable_modem: {
        ...cableModemWithSnmp,
        pnm_parameters: {
          tftp: {
            ipv4: defaults.tftpIpv4,
            ipv6: defaults.tftpIpv6,
          },
        },
      },
      analysis: {
        ...basicAnalysis,
        spectrum_analysis: {
          moving_average: {
            points: 10,
          },
        },
      },
      capture_parameters: {
        inactivity_timeout: 60,
        first_segment_center_freq: 300000000,
        last_segment_center_freq: 900000000,
        resolution_bw: 30000,
        noise_bw: 150,
        window_function: 1,
        num_averages: 1,
        spectrum_retrieval_type: SNMP_SPECTRUM_RETRIEVAL_TYPE,
      },
    },
    spectrumFullBand: {
      cable_modem: {
        ...cableModemWithSnmp,
        pnm_parameters: {
          tftp: {
            ipv4: defaults.tftpIpv4,
            ipv6: defaults.tftpIpv6,
          },
        },
      },
      analysis: {
        ...basicAnalysis,
        spectrum_analysis: {
          moving_average: {
            points: 10,
          },
        },
      },
      capture_parameters: {
        inactivity_timeout: 60,
        direction: "downstream",
        resolution_bw: 300000,
        noise_bw: 150,
        window_function: 1,
        num_averages: 1,
        spectrum_retrieval_type: SNMP_SPECTRUM_RETRIEVAL_TYPE,
      },
    },
    spectrumOfdm: {
      cable_modem: cableModemWithPnm,
      analysis: {
        ...basicAnalysis,
        spectrum_analysis: {
          moving_average: {
            points: 10,
          },
        },
      },
      capture_parameters: {
        number_of_averages: 1,
        resolution_bandwidth_hz: 25000,
        spectrum_retrieval_type: SNMP_SPECTRUM_RETRIEVAL_TYPE,
      },
    },
  };
}

function assertSpectrumPayloadSnmpOnly(payloads) {
  const spectrumPayloads = [payloads.spectrumFriendly, payloads.spectrumFullBand, payloads.spectrumOfdm];
  for (const payload of spectrumPayloads) {
    const actual = payload?.capture_parameters?.spectrum_retrieval_type;
    if (actual !== SNMP_SPECTRUM_RETRIEVAL_TYPE) {
      throw new Error(`Spectrum payload must use SNMP retrieval type ${SNMP_SPECTRUM_RETRIEVAL_TYPE}, found ${String(actual)}`);
    }
  }
}

function log(message) {
  process.stdout.write(`[live-capture] ${message}\n`);
}

function asRepoRelativePath(absolutePath) {
  const next = relative(ROOT_DIR, absolutePath).replaceAll("\\", "/");
  return next || absolutePath;
}

async function callEndpoint(baseUrl, endpointPath, payload, method = "POST") {
  const response = await fetch(`${baseUrl}${endpointPath}`, {
    method,
    signal: AbortSignal.timeout(90000),
    headers: {
      "Content-Type": "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}

function buildAdvancedStartPayload(defaults, measureMode) {
  return {
    cable_modem: {
      mac_address: defaults.macAddress,
      ip_address: defaults.ipAddress,
      pnm_parameters: {
        tftp: { ipv4: defaults.tftpIpv4, ipv6: defaults.tftpIpv6 },
        capture: { channel_ids: [] },
      },
      snmp: { snmpV2C: { community: defaults.community } },
    },
    capture: {
      parameters: {
        measurement_duration: 30,
        sample_interval: 1,
      },
    },
    measure: { mode: measureMode },
  };
}

function statusState(statusResponse) {
  return String(statusResponse?.operation?.state ?? "").toLowerCase();
}

function isRunningState(state) {
  return state === "running" || state === "starting" || state === "pending" || state === "queued";
}

async function waitForAdvancedCompletion(baseUrl, workflow, operationId) {
  const statusEndpoint = workflow.statusPath.replace("{operation_id}", operationId);
  const maxPolls = 80;
  const pollDelayMs = 3000;
  let lastStatus = null;

  for (let index = 0; index < maxPolls; index += 1) {
    const status = await callEndpoint(baseUrl, statusEndpoint, {}, "GET");
    lastStatus = status;
    const state = statusState(status);
    if (!isRunningState(state)) {
      return status;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, pollDelayMs));
  }

  return lastStatus;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const runtimeConfig = readRuntimeConfig();
  const instance = pickInstance(runtimeConfig);
  const defaults = {
    macAddress: instance?.request_defaults?.cable_modem?.mac_address ?? "",
    ipAddress: instance?.request_defaults?.cable_modem?.ip_address ?? "",
    tftpIpv4: instance?.request_defaults?.tftp?.ipv4 ?? "",
    tftpIpv6: instance?.request_defaults?.tftp?.ipv6 ?? "::1",
    community: instance?.request_defaults?.snmp?.rw_community ?? "private",
  };

  if (!instance?.base_url) {
    throw new Error("Selected runtime instance has no base_url.");
  }

  log(`MAC OUI sanitizer mask: ${args.macOuiMask}`);
  const payloads = buildPayloads(defaults);
  assertSpectrumPayloadSnmpOnly(payloads);
  const summary = {
    generated_at: new Date().toISOString(),
    base_url: instance.base_url,
    instance_id: instance.id ?? null,
    outputs: [],
  };

  for (const target of ENDPOINTS) {
    const payload = payloads[target.payloadType];
    const outputPath = join(OUTPUT_DIR, `${target.id}.sanitized.json`);
    try {
      log(`Calling ${target.endpointPath}`);
      const raw = await callEndpoint(instance.base_url, target.endpointPath, payload);
      const sanitized = sanitizeCapturePayload(raw, {
        macOuiMask: args.macOuiMask,
      });
      writeFileSync(outputPath, `${JSON.stringify(sanitized, null, 2)}\n`, "utf-8");
      summary.outputs.push({
        id: target.id,
        endpoint: target.endpointPath,
        status: "ok",
        output_path: asRepoRelativePath(outputPath),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      writeFileSync(
        outputPath,
        `${JSON.stringify({ status: "error", endpoint: target.endpointPath, message }, null, 2)}\n`,
        "utf-8",
      );
      summary.outputs.push({
        id: target.id,
        endpoint: target.endpointPath,
        status: "error",
        output_path: asRepoRelativePath(outputPath),
        error: message,
      });
      log(`Failed ${target.endpointPath}: ${message}`);
    }
  }

  for (const workflow of ADVANCED_WORKFLOWS) {
    try {
      log(`Starting ${workflow.id}`);
      const startPayload = buildAdvancedStartPayload(defaults, workflow.measureMode);
      const startResponse = await callEndpoint(instance.base_url, workflow.startPath, startPayload);
      const operationId = String(startResponse?.operation_id ?? "").trim();
      if (!operationId) {
        throw new Error(`${workflow.id} start response missing operation_id`);
      }

      const startOutputPath = join(OUTPUT_DIR, `${workflow.id}-start.sanitized.json`);
      writeFileSync(
        startOutputPath,
        `${JSON.stringify(sanitizeCapturePayload(startResponse, { macOuiMask: args.macOuiMask }), null, 2)}\n`,
        "utf-8",
      );
      summary.outputs.push({
        id: `${workflow.id}-start`,
        endpoint: workflow.startPath,
        status: "ok",
        output_path: asRepoRelativePath(startOutputPath),
      });

      log(`Polling ${workflow.id} status (${operationId})`);
      const finalStatus = await waitForAdvancedCompletion(instance.base_url, workflow, operationId);
      const statusOutputPath = join(OUTPUT_DIR, `${workflow.id}-status.sanitized.json`);
      writeFileSync(
        statusOutputPath,
        `${JSON.stringify(sanitizeCapturePayload(finalStatus, { macOuiMask: args.macOuiMask }), null, 2)}\n`,
        "utf-8",
      );
      summary.outputs.push({
        id: `${workflow.id}-status`,
        endpoint: workflow.statusPath.replace("{operation_id}", operationId),
        status: "ok",
        output_path: asRepoRelativePath(statusOutputPath),
      });

      for (const analysisType of workflow.analysisTypes) {
        const analysisPayload = {
          operation_id: operationId,
          analysis: {
            type: analysisType,
            output: { type: "json" },
            plot: { ui: { theme: "dark" } },
          },
        };
        log(`Running ${workflow.id} analysis ${analysisType}`);
        try {
          const analysisResponse = await callEndpoint(instance.base_url, workflow.analysisPath, analysisPayload);
          const outputPath = join(OUTPUT_DIR, `${workflow.id}-analysis-${analysisType}.sanitized.json`);
          writeFileSync(
            outputPath,
            `${JSON.stringify(sanitizeCapturePayload(analysisResponse, { macOuiMask: args.macOuiMask }), null, 2)}\n`,
            "utf-8",
          );
          summary.outputs.push({
            id: `${workflow.id}-analysis-${analysisType}`,
            endpoint: workflow.analysisPath,
            status: "ok",
            output_path: asRepoRelativePath(outputPath),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const outputPath = join(OUTPUT_DIR, `${workflow.id}-analysis-${analysisType}.sanitized.json`);
          writeFileSync(
            outputPath,
            `${JSON.stringify({ status: "error", workflow: workflow.id, analysis_type: analysisType, endpoint: workflow.analysisPath, message }, null, 2)}\n`,
            "utf-8",
          );
          summary.outputs.push({
            id: `${workflow.id}-analysis-${analysisType}`,
            endpoint: workflow.analysisPath,
            status: "error",
            output_path: asRepoRelativePath(outputPath),
            error: message,
          });
          log(`Failed ${workflow.id} analysis ${analysisType}: ${message}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const outputPath = join(OUTPUT_DIR, `${workflow.id}.sanitized.json`);
      writeFileSync(
        outputPath,
        `${JSON.stringify({ status: "error", workflow: workflow.id, endpoint: workflow.startPath, message }, null, 2)}\n`,
        "utf-8",
      );
      summary.outputs.push({
        id: workflow.id,
        endpoint: workflow.startPath,
        status: "error",
        output_path: asRepoRelativePath(outputPath),
        error: message,
      });
      log(`Failed workflow ${workflow.id}: ${message}`);
    }
  }

  const summaryPath = join(OUTPUT_DIR, "summary.json");
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
  log(`Wrote ${summaryPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[live-capture][error] ${message}\n`);
  process.exit(1);
});
