import { mergeRuntimeConfig } from "../config-menu/runtime_config_merge.js";

export const LOCAL_PYPNM_INSTANCE_ID = "local-pypnm-agent";
export const LOCAL_PYPNM_INSTANCE_LABEL = "Local PyPNM Agent";
export const PYPNM_DEFAULT_PORT = 8000;
export const WEBUI_DEFAULT_PORT = 4175;

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeHostChoice(host) {
  return String(host ?? "").trim();
}

function normalizeBaseUrl(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return "";
  }
  try {
    const parsed = new URL(value.trim());
    const protocol = parsed.protocol.toLowerCase();
    const host = parsed.hostname.toLowerCase();
    const port = parsed.port || (protocol === "https:" ? "443" : protocol === "http:" ? "80" : "");
    return `${protocol}//${host}:${port}`;
  } catch {
    return value.trim().toLowerCase();
  }
}

export function buildLocalPyPnmInstance(apiHost, apiPort = PYPNM_DEFAULT_PORT) {
  const normalizedHost = normalizeHostChoice(apiHost);
  if (normalizedHost === "") {
    throw new Error("Local PyPNM host is required.");
  }
  const normalizedPort = Number.isInteger(apiPort) && apiPort >= 1 && apiPort <= 65535 ? apiPort : PYPNM_DEFAULT_PORT;

  return {
    id: LOCAL_PYPNM_INSTANCE_ID,
    label: LOCAL_PYPNM_INSTANCE_LABEL,
    base_url: `http://${normalizedHost}:${normalizedPort}`,
    enabled: true,
    tags: ["local", "combined-install"],
    capabilities: ["health", "analysis", "files"],
    polling: {
      enabled: true,
      interval_ms: 5000,
    },
    request_defaults: {
      cable_modem: {
        mac_address: "",
        ip_address: "",
      },
      tftp: {
        ipv4: normalizedHost === "127.0.0.1" ? "127.0.0.1" : normalizedHost,
        ipv6: "::1",
      },
      capture: {
        channel_ids: [],
      },
      snmp: {
        rw_community: "private",
      },
    },
  };
}

export function applyLocalPyPnmAgentConfig(templateConfig, localConfig, apiHost, apiPort = PYPNM_DEFAULT_PORT) {
  const nextLocalConfig = cloneValue(localConfig ?? {});
  const existingInstances = Array.isArray(nextLocalConfig.instances) ? nextLocalConfig.instances : [];
  const preservedInstances = existingInstances.filter((instance) => instance?.id !== LOCAL_PYPNM_INSTANCE_ID);
  const existingLocalInstance = existingInstances.find((instance) => instance?.id === LOCAL_PYPNM_INSTANCE_ID);
  const generatedLocalInstance = buildLocalPyPnmInstance(apiHost, apiPort);
  const nextLocalInstance = existingLocalInstance
    ? mergeRuntimeConfig(
        {
          version: 1,
          defaults: {
            selected_instance: LOCAL_PYPNM_INSTANCE_ID,
          },
          instances: [generatedLocalInstance],
        },
        {
          version: 1,
          defaults: {
            selected_instance: LOCAL_PYPNM_INSTANCE_ID,
          },
          instances: [existingLocalInstance],
        },
      ).instances[0]
    : generatedLocalInstance;

  const nextLocalInstanceBaseUrl = normalizeBaseUrl(nextLocalInstance?.base_url);
  const dedupedPreservedInstances = preservedInstances.filter((instance) => {
    if (nextLocalInstanceBaseUrl === "") {
      return true;
    }
    return normalizeBaseUrl(instance?.base_url) !== nextLocalInstanceBaseUrl;
  });

  nextLocalConfig.instances = [nextLocalInstance, ...dedupedPreservedInstances];
  nextLocalConfig.defaults = {
    ...(nextLocalConfig.defaults ?? {}),
    selected_instance: LOCAL_PYPNM_INSTANCE_ID,
  };

  return mergeRuntimeConfig(templateConfig ?? {}, nextLocalConfig);
}

export function readConfiguredLocalPyPnmHost(config) {
  const instances = Array.isArray(config?.instances) ? config.instances : [];
  const localInstance = instances.find((instance) => instance?.id === LOCAL_PYPNM_INSTANCE_ID);
  const baseUrl = typeof localInstance?.base_url === "string" ? localInstance.base_url.trim() : "";

  if (baseUrl === "") {
    return "";
  }

  try {
    return new URL(baseUrl).hostname;
  } catch {
    return "";
  }
}

export function readConfiguredLocalPyPnmPort(config) {
  const instances = Array.isArray(config?.instances) ? config.instances : [];
  const localInstance = instances.find((instance) => instance?.id === LOCAL_PYPNM_INSTANCE_ID);
  const baseUrl = typeof localInstance?.base_url === "string" ? localInstance.base_url.trim() : "";

  if (baseUrl === "") {
    return PYPNM_DEFAULT_PORT;
  }

  try {
    const parsed = new URL(baseUrl);
    if (parsed.port === "") {
      return parsed.protocol === "https:" ? 443 : 80;
    }
    const parsedPort = Number.parseInt(parsed.port, 10);
    return Number.isInteger(parsedPort) ? parsedPort : PYPNM_DEFAULT_PORT;
  } catch {
    return PYPNM_DEFAULT_PORT;
  }
}

export function parseIpv4Candidates(rawOutput) {
  const lines = String(rawOutput ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const seenIps = new Set();
  const candidates = [];

  for (const line of lines) {
    const [iface, address] = line.split(/\s+/, 2);
    const ip = String(address ?? "").replace(/\/.*$/, "").trim();
    if (iface === undefined || ip === "" || seenIps.has(ip)) {
      continue;
    }
    seenIps.add(ip);
    candidates.push({ iface, ip });
  }

  return candidates;
}

export function choosePreferredLocalHost({
  explicitHost = "",
  existingHost = "",
  candidates = [],
  isInteractive = true,
} = {}) {
  const normalizedExplicitHost = normalizeHostChoice(explicitHost);
  if (normalizedExplicitHost !== "") {
    return {
      host: normalizedExplicitHost,
      source: "explicit",
      needsPrompt: false,
      choices: [],
    };
  }

  const normalizedExistingHost = normalizeHostChoice(existingHost);
  if (normalizedExistingHost !== "") {
    return {
      host: normalizedExistingHost,
      source: "existing",
      needsPrompt: false,
      choices: [],
    };
  }

  const normalizedCandidates = Array.isArray(candidates)
    ? candidates.filter((candidate) => normalizeHostChoice(candidate?.ip) !== "")
    : [];

  if (!isInteractive) {
    return {
      host: "127.0.0.1",
      source: "non-interactive-default",
      needsPrompt: false,
      choices: [],
    };
  }

  if (normalizedCandidates.length === 0) {
    return {
      host: "127.0.0.1",
      source: "loopback-default",
      needsPrompt: false,
      choices: [],
    };
  }

  if (normalizedCandidates.length === 1) {
    return {
      host: "",
      source: "prompt",
      needsPrompt: true,
      choices: [
        { label: "Loopback only", host: "127.0.0.1", detail: "Use the backend from the same machine only." },
        {
          label: `${normalizedCandidates[0].iface} (${normalizedCandidates[0].ip})`,
          host: normalizedCandidates[0].ip,
          detail: "Use the detected interface address.",
        },
      ],
    };
  }

  return {
    host: "",
    source: "prompt",
    needsPrompt: true,
    choices: [
      { label: "Loopback only", host: "127.0.0.1", detail: "Use the backend from the same machine only." },
      ...normalizedCandidates.map((candidate) => ({
        label: `${candidate.iface} (${candidate.ip})`,
        host: candidate.ip,
        detail: "Use the detected interface address.",
      })),
    ],
  };
}
