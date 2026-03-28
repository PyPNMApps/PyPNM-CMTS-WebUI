#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "..", "..");
const PREVIEW_PORT = Number(process.env.UI_PREVIEW_PORT ?? "4173");
const PREVIEW_HOST = process.env.UI_PREVIEW_HOST ?? "127.0.0.1";
const PREVIEW_BASE_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;
const OUTPUT_DIR = join(ROOT_DIR, "docs", "images", "ui-previews");
const DOC_PREVIEW_DIR = join(ROOT_DIR, "docs", "user", "ui-previews");
const LIVE_CAPTURE_SUMMARY_PATH = join(ROOT_DIR, "docs", "examples", "live-captures", "summary.json");

const ROUTES = [
  { title: "Signal Capture · RxMER", path: "/single-capture/rxmer", slug: "single-capture-rxmer", section: "signal-capture" },
  { title: "Signal Capture · Channel Estimation", path: "/single-capture/channel-est-coeff", slug: "single-capture-channel-estimation", section: "signal-capture" },
  { title: "Signal Capture · Histogram", path: "/single-capture/histogram", slug: "single-capture-histogram", section: "signal-capture" },
  { title: "Signal Capture · FEC Summary", path: "/single-capture/fec-summary", slug: "single-capture-fec-summary", section: "signal-capture" },
  { title: "Signal Capture · Constellation Display", path: "/single-capture/constellation-display", slug: "single-capture-constellation-display", section: "signal-capture" },
  { title: "Signal Capture · Modulation Profile", path: "/single-capture/modulation-profile", slug: "single-capture-modulation-profile", section: "signal-capture" },
  { title: "Signal Capture · OFDMA PreEqualization", path: "/single-capture/us-ofdma-pre-equalization", slug: "single-capture-us-ofdma-pre-equalization", section: "signal-capture" },
  { title: "Spectrum Analyzer · Friendly", path: "/spectrum-analyzer/friendly", slug: "spectrum-analyzer-friendly", section: "spectrum-analyzer" },
  { title: "Spectrum Analyzer · Full Band", path: "/spectrum-analyzer/full-band", slug: "spectrum-analyzer-full-band", section: "spectrum-analyzer" },
  { title: "Spectrum Analyzer · OFDM", path: "/spectrum-analyzer/ofdm", slug: "spectrum-analyzer-ofdm", section: "spectrum-analyzer" },
  { title: "Spectrum Analyzer · SCQAM", path: "/spectrum-analyzer/scqam", slug: "spectrum-analyzer-scqam", section: "spectrum-analyzer" },
  { title: "Advanced · RxMER · Min / Avg / Max", path: "/advanced/rxmer", slug: "advanced-rxmer-min-avg-max", section: "advanced", analysisType: "min-avg-max" },
  { title: "Advanced · RxMER · Heat Map", path: "/advanced/rxmer", slug: "advanced-rxmer-rxmer-heat-map", section: "advanced", analysisType: "rxmer-heat-map" },
  { title: "Advanced · RxMER · Echo Detection 1", path: "/advanced/rxmer", slug: "advanced-rxmer-echo-reflection-1", section: "advanced", analysisType: "echo-reflection-1" },
  { title: "Advanced · RxMER · OFDM Profile Performance 1", path: "/advanced/rxmer", slug: "advanced-rxmer-ofdm-profile-performance-1", section: "advanced", analysisType: "ofdm-profile-performance-1" },
  { title: "Advanced · Channel Estimation · Min / Avg / Max", path: "/advanced/channel-estimation", slug: "advanced-channel-estimation-min-avg-max", section: "advanced", analysisType: "min-avg-max" },
  { title: "Advanced · Channel Estimation · Group Delay", path: "/advanced/channel-estimation", slug: "advanced-channel-estimation-group-delay", section: "advanced", analysisType: "group-delay" },
  { title: "Advanced · Channel Estimation · LTE Detection Phase Slope", path: "/advanced/channel-estimation", slug: "advanced-channel-estimation-lte-detection-phase-slope", section: "advanced", analysisType: "lte-detection-phase-slope" },
  { title: "Advanced · Channel Estimation · Echo Detection IFFT", path: "/advanced/channel-estimation", slug: "advanced-channel-estimation-echo-detection-ifft", section: "advanced", analysisType: "echo-detection-ifft" },
  { title: "Advanced · OFDMA PreEq · Min / Avg / Max", path: "/advanced/ofdma-pre-eq", slug: "advanced-ofdma-pre-eq-min-avg-max", section: "advanced", analysisType: "min-avg-max" },
  { title: "Advanced · OFDMA PreEq · Group Delay", path: "/advanced/ofdma-pre-eq", slug: "advanced-ofdma-pre-eq-group-delay", section: "advanced", analysisType: "group-delay" },
  { title: "Advanced · OFDMA PreEq · Echo Detection IFFT", path: "/advanced/ofdma-pre-eq", slug: "advanced-ofdma-pre-eq-echo-detection-ifft", section: "advanced", analysisType: "echo-detection-ifft" },
  { title: "Operations · Base Capability", path: "/operations/if31-docsis-base-capability", slug: "operations-if31-docsis-base-capability", section: "operations" },
  { title: "Operations · OFDM Channel Stats", path: "/operations/ds-ofdm-channel-stats", slug: "operations-ds-ofdm-channel-stats", section: "operations" },
  { title: "Operations · OFDM Profile Stats", path: "/operations/ds-ofdm-profile-stats", slug: "operations-ds-ofdm-profile-stats", section: "operations" },
  { title: "Operations · System Diplexer", path: "/operations/if31-system-diplexer", slug: "operations-if31-system-diplexer", section: "operations" },
  { title: "Operations · OFDMA Channel Stats", path: "/operations/us-ofdma-channel-stats", slug: "operations-us-ofdma-channel-stats", section: "operations" },
  { title: "Operations · Diplexer Band Edge Capability", path: "/operations/fdd-diplexer-band-edge-capability", slug: "operations-fdd-diplexer-band-edge-capability", section: "operations" },
  { title: "Operations · FDD System Diplexer Configuration", path: "/operations/fdd-system-diplexer-configuration", slug: "operations-fdd-system-diplexer-configuration", section: "operations" },
  { title: "Operations · SCQAM Codeword Error Rate", path: "/operations/ds-scqam-codeword-error-rate", slug: "operations-ds-scqam-codeword-error-rate", section: "operations" },
  { title: "Operations · SCQAM Channel Stats", path: "/operations/ds-scqam-channel-stats", slug: "operations-ds-scqam-channel-stats", section: "operations" },
  { title: "Operations · ATDMA PreEqualization", path: "/operations/atdma-pre-equalization", slug: "operations-atdma-pre-equalization", section: "operations" },
  { title: "Operations · ATDMA Channel Stats", path: "/operations/atdma-channel-stats", slug: "operations-atdma-channel-stats", section: "operations" },
  { title: "Operations · Event Log", path: "/operations/event-log", slug: "operations-event-log", section: "operations" },
  { title: "Operations · Interface Stats", path: "/operations/interface-stats", slug: "operations-interface-stats", section: "operations" },
  { title: "Operations · UpTime", path: "/operations/up-time", slug: "operations-up-time", section: "operations" },
  { title: "Files", path: "/files", slug: "files", section: "platform" },
  { title: "Health", path: "/health", slug: "health", section: "platform" },
  { title: "Settings", path: "/settings", slug: "settings", section: "platform" },
  { title: "About", path: "/about", slug: "about", section: "platform" },
];

function log(message) {
  process.stdout.write(`[docs-ui-previews] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[docs-ui-previews][error] ${message}\n`);
  process.exit(1);
}

async function waitForServerReady(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status === 404) {
        return;
      }
    } catch {
      // Server still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startPreviewServer() {
  const preview = spawn(
    "npm",
    ["run", "preview", "--", "--host", PREVIEW_HOST, "--port", String(PREVIEW_PORT), "--strictPort"],
    {
      cwd: ROOT_DIR,
      env: process.env,
      stdio: "inherit",
    },
  );
  return preview;
}

function renderOverviewPage() {
  return [
    "# UI Preview Gallery",
    "",
    "Auto-generated screenshots for key WebUI routes.",
    "",
    `Base URL captured: \`${PREVIEW_BASE_URL}\``,
    "",
    "To regenerate:",
    "",
    "`npm run docs:capture-ui-previews`",
    "",
    "## Sections",
    "",
    "- [Signal Capture](signal-capture.md)",
    "- [Spectrum Analyzer](spectrum-analyzer.md)",
    "- [Advanced](advanced.md)",
    "- [Operations](operations.md)",
    "- [Platform](platform.md)",
    "",
  ].join("\n");
}

function renderSectionPage(title, captures) {
  const lines = [
    `# ${title}`,
    "",
    `Base URL captured: \`${PREVIEW_BASE_URL}\``,
    "",
  ];

  captures.forEach((capture) => {
    lines.push(`## ${capture.title}`);
    lines.push("");
    lines.push(`Route: \`${capture.path}\``);
    lines.push("");
    lines.push(`[![${capture.title}](../../images/ui-previews/${capture.fileName})](../../images/ui-previews/${capture.fileName})`);
    lines.push("");
  });

  return lines.join("\n");
}

const ADVANCED_ANALYSIS_ENDPOINTS = {
  rxmer: "/advance/multi/ds/rxMer/analysis",
  channelEstimation: "/advance/multi/ds/channelEstimation/analysis",
  ofdmaPreEq: "/advance/multi/us/ofdmaPreEqualization/analysis",
};
const FALLBACK_SYSDESCR_PAYLOAD = {
  status: 0,
  message: null,
  device: {
    mac_address: "00:00:00:00:00:00",
    system_description: {
      HW_REV: "n/a",
      VENDOR: "n/a",
      BOOTR: "n/a",
      SW_REV: "n/a",
      MODEL: "n/a",
      is_empty: false,
    },
  },
  results: {
    sysDescr: {
      hw_rev: "n/a",
      vendor: "n/a",
      boot_rev: "n/a",
      sw_rev: "n/a",
      model: "n/a",
      _is_empty: false,
    },
  },
};

function parseAdvancedOperationId(outputs, statusIdPrefix) {
  const match = outputs.find((output) => typeof output?.id === "string" && output.id.startsWith(statusIdPrefix));
  const endpoint = typeof match?.endpoint === "string" ? match.endpoint : "";
  const parsed = endpoint.match(/\/status\/([^/]+)$/);
  return parsed?.[1] ?? "";
}

function loadCaptureMocks() {
  if (!existsSync(LIVE_CAPTURE_SUMMARY_PATH)) {
    fail(`Missing ${LIVE_CAPTURE_SUMMARY_PATH}. Run docs:capture-live-endpoint-examples first.`);
  }

  const summary = JSON.parse(readFileSync(LIVE_CAPTURE_SUMMARY_PATH, "utf-8"));
  const outputs = Array.isArray(summary?.outputs) ? summary.outputs : [];
  const endpointPayloads = new Map();
  const advancedAnalysisPayloads = {
    rxmer: new Map(),
    channelEstimation: new Map(),
    ofdmaPreEq: new Map(),
  };

  const addAdvancedAnalysisPayload = (workflow, outputIdPrefix, analysisType, output, resolvedOutputPath) => {
    if (typeof output?.id !== "string" || output.id !== `${outputIdPrefix}${analysisType}`) {
      return;
    }
    if (!resolvedOutputPath || !existsSync(resolvedOutputPath)) {
      return;
    }
    if (advancedAnalysisPayloads[workflow].has(analysisType)) {
      return;
    }
    advancedAnalysisPayloads[workflow].set(analysisType, JSON.parse(readFileSync(resolvedOutputPath, "utf-8")));
  };

  for (const output of outputs) {
    const explicitOutputPath = typeof output?.output_path === "string"
      ? (output.output_path.startsWith("/") ? output.output_path : join(ROOT_DIR, output.output_path))
      : "";
    const fallbackOutputPath = typeof output?.id === "string"
      ? join(ROOT_DIR, "docs", "examples", "live-captures", `${output.id}.sanitized.json`)
      : "";
    const resolvedOutputPath = explicitOutputPath || (fallbackOutputPath && existsSync(fallbackOutputPath) ? fallbackOutputPath : "");

    addAdvancedAnalysisPayload("rxmer", "advanced-rxmer-analysis-", "rxmer-heat-map", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("rxmer", "advanced-rxmer-analysis-", "echo-reflection-1", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("rxmer", "advanced-rxmer-analysis-", "ofdm-profile-performance-1", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("rxmer", "advanced-rxmer-analysis-", "min-avg-max", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("channelEstimation", "advanced-channel-estimation-analysis-", "min-avg-max", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("channelEstimation", "advanced-channel-estimation-analysis-", "group-delay", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("channelEstimation", "advanced-channel-estimation-analysis-", "lte-detection-phase-slope", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("channelEstimation", "advanced-channel-estimation-analysis-", "echo-detection-ifft", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("ofdmaPreEq", "advanced-ofdma-pre-eq-analysis-", "min-avg-max", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("ofdmaPreEq", "advanced-ofdma-pre-eq-analysis-", "group-delay", output, resolvedOutputPath);
    addAdvancedAnalysisPayload("ofdmaPreEq", "advanced-ofdma-pre-eq-analysis-", "echo-detection-ifft", output, resolvedOutputPath);

    if (!output || typeof output.endpoint !== "string" || !resolvedOutputPath) {
      continue;
    }

    if (endpointPayloads.has(output.endpoint)) {
      continue;
    }

    endpointPayloads.set(output.endpoint, JSON.parse(readFileSync(resolvedOutputPath, "utf-8")));
  }

  return {
    endpointPayloads,
    advanced: {
      rxmer: {
        operationId: parseAdvancedOperationId(outputs, "advanced-rxmer-status"),
        analysisPayloads: advancedAnalysisPayloads.rxmer,
      },
      channelEstimation: {
        operationId: parseAdvancedOperationId(outputs, "advanced-channel-estimation-status"),
        analysisPayloads: advancedAnalysisPayloads.channelEstimation,
      },
      ofdmaPreEq: {
        operationId: parseAdvancedOperationId(outputs, "advanced-ofdma-pre-eq-status"),
        analysisPayloads: advancedAnalysisPayloads.ofdmaPreEq,
      },
    },
  };
}

function shouldRunCaptureBeforeScreenshot(route) {
  return route.section === "operations" || route.section === "signal-capture" || route.section === "spectrum-analyzer" || route.section === "advanced";
}

async function runStandardCapture(page, route) {
  if (route.section !== "operations" && route.section !== "signal-capture" && route.section !== "spectrum-analyzer") {
    return;
  }

  const submitButton = page.getByRole("button", { name: /^(Get Capture|Run )/ }).first();
  await submitButton.waitFor({ state: "visible", timeout: 30_000 });
  await submitButton.click();
  await page.getByText("No capture results yet. Run the operation to populate this panel.").waitFor({
    state: "hidden",
    timeout: 30_000,
  });
  await page.waitForTimeout(500);
}

async function runAdvancedCapture(page, route, mocks) {
  if (route.section !== "advanced") {
    return;
  }

  const waitForAnalysisRender = async () => {
    await page.getByRole("button", { name: "Run Analysis" }).waitFor({ state: "visible", timeout: 30_000 });
    const downloadButtons = page.getByRole("button", { name: "Download JSON" });
    await downloadButtons.first().waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForTimeout(900);
  };

  if (route.path === "/advanced/rxmer") {
    const operationId = mocks.advanced.rxmer.operationId;
    const analysisPayloads = mocks.advanced.rxmer.analysisPayloads;
    const selectedAnalysisType = String(route.analysisType ?? "min-avg-max");
    if (!operationId || !analysisPayloads.has(selectedAnalysisType)) {
      log(`Skipping advanced capture on ${route.path}; missing mock operation id or analysis payload.`);
      return;
    }
    await page.fill("#advancedRxmerOperationId", operationId);
    await page.selectOption("#advancedRxmerAnalysisType", selectedAnalysisType);
    await page.getByRole("button", { name: "Run Analysis" }).click();
    await waitForAnalysisRender();
    return;
  }

  if (route.path === "/advanced/channel-estimation") {
    const operationId = mocks.advanced.channelEstimation.operationId;
    const analysisPayloads = mocks.advanced.channelEstimation.analysisPayloads;
    const selectedAnalysisType = String(route.analysisType ?? "min-avg-max");
    if (!operationId || !analysisPayloads.has(selectedAnalysisType)) {
      log(`Skipping advanced capture on ${route.path}; missing mock operation id or analysis payload.`);
      return;
    }
    await page.fill("#advancedChanEstOperationId", operationId);
    await page.selectOption("#advancedChanEstAnalysisType", selectedAnalysisType);
    await page.getByRole("button", { name: "Run Analysis" }).click();
    await waitForAnalysisRender();
    return;
  }

  if (route.path === "/advanced/ofdma-pre-eq") {
    const operationId = mocks.advanced.ofdmaPreEq.operationId;
    const analysisPayloads = mocks.advanced.ofdmaPreEq.analysisPayloads;
    const selectedAnalysisType = String(route.analysisType ?? "min-avg-max");
    if (!operationId || !analysisPayloads.has(selectedAnalysisType)) {
      log(`Skipping advanced capture on ${route.path}; missing mock operation id or analysis payload.`);
      return;
    }
    await page.fill("#advancedOfdmaPreEqOperationId", operationId);
    await page.selectOption("#advancedOfdmaPreEqAnalysisType", selectedAnalysisType);
    await page.getByRole("button", { name: "Run Analysis" }).click();
    await waitForAnalysisRender();
  }
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(DOC_PREVIEW_DIR, { recursive: true });

  const mocks = loadCaptureMocks();
  const preview = startPreviewServer();
  let browser;
  try {
    log(`Waiting for preview server at ${PREVIEW_BASE_URL}`);
    await waitForServerReady(`${PREVIEW_BASE_URL}/`);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1720, height: 980 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.continue();
        return;
      }

      const requestUrl = new URL(request.url());
      if (requestUrl.pathname === ADVANCED_ANALYSIS_ENDPOINTS.rxmer || requestUrl.pathname === ADVANCED_ANALYSIS_ENDPOINTS.channelEstimation || requestUrl.pathname === ADVANCED_ANALYSIS_ENDPOINTS.ofdmaPreEq) {
        let analysisType = "";
        try {
          const requestBody = request.postDataJSON();
          analysisType = String(requestBody?.analysis?.type ?? "");
        } catch {
          analysisType = "";
        }
        const analysisPayloadMap = requestUrl.pathname === ADVANCED_ANALYSIS_ENDPOINTS.rxmer
          ? mocks.advanced.rxmer.analysisPayloads
          : requestUrl.pathname === ADVANCED_ANALYSIS_ENDPOINTS.channelEstimation
            ? mocks.advanced.channelEstimation.analysisPayloads
            : mocks.advanced.ofdmaPreEq.analysisPayloads;
        const payload = analysisPayloadMap.get(analysisType);
        if (payload) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(payload),
          });
          return;
        }
      }

      const payload = mocks.endpointPayloads.get(requestUrl.pathname);
      if (!payload && requestUrl.pathname === "/system/sysDescr") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(FALLBACK_SYSDESCR_PAYLOAD),
        });
        return;
      }
      if (!payload) {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    const captures = [];
    for (const route of ROUTES) {
      const targetUrl = `${PREVIEW_BASE_URL}${route.path}`;
      log(`Capturing ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 60_000 });
      if (shouldRunCaptureBeforeScreenshot(route)) {
        await runStandardCapture(page, route);
        await runAdvancedCapture(page, route, mocks);
      }
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, 0));
      const fileName = `${route.slug}.png`;
      const filePath = join(OUTPUT_DIR, fileName);
      await page.screenshot({ path: filePath, fullPage: true });
      captures.push({ ...route, fileName });
    }

    const overviewPath = join(DOC_PREVIEW_DIR, "index.md");
    const signalCapturePath = join(DOC_PREVIEW_DIR, "signal-capture.md");
    const spectrumAnalyzerPath = join(DOC_PREVIEW_DIR, "spectrum-analyzer.md");
    const advancedPath = join(DOC_PREVIEW_DIR, "advanced.md");
    const operationsPath = join(DOC_PREVIEW_DIR, "operations.md");
    const platformPath = join(DOC_PREVIEW_DIR, "platform.md");

    writeFileSync(overviewPath, renderOverviewPage(), "utf-8");
    writeFileSync(signalCapturePath, renderSectionPage("Signal Capture UI Previews", captures.filter((item) => item.section === "signal-capture")), "utf-8");
    writeFileSync(spectrumAnalyzerPath, renderSectionPage("Spectrum Analyzer UI Previews", captures.filter((item) => item.section === "spectrum-analyzer")), "utf-8");
    writeFileSync(advancedPath, renderSectionPage("Advanced UI Previews", captures.filter((item) => item.section === "advanced")), "utf-8");
    writeFileSync(operationsPath, renderSectionPage("Operations UI Previews", captures.filter((item) => item.section === "operations")), "utf-8");
    writeFileSync(platformPath, renderSectionPage("Platform UI Previews", captures.filter((item) => item.section === "platform")), "utf-8");

    log(`Wrote ${overviewPath}`);
    log(`Wrote ${signalCapturePath}`);
    log(`Wrote ${spectrumAnalyzerPath}`);
    log(`Wrote ${advancedPath}`);
    log(`Wrote ${operationsPath}`);
    log(`Wrote ${platformPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Executable doesn't exist")) {
      fail("Playwright browser is missing. Run: npx playwright install chromium");
    }
    fail(message);
  } finally {
    if (browser) {
      await browser.close();
    }
    if (preview && !preview.killed) {
      preview.kill("SIGTERM");
    }
  }
}

main();
