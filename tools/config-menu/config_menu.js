import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { parse, stringify } from "yaml";

const DEFAULT_CONFIG = {
  version: 1,
  defaults: {
    selected_instance: "default",
    poll_interval_ms: 5000,
    request_timeout_ms: 30000,
    health_path: "/health",
    logging: {
      level: "INFO",
    },
  },
  instances: [],
};
const AGENT_BRAND = "PyPNM-CMTS";
const AGENT_LABEL_SINGULAR = `${AGENT_BRAND} Agent`;
const AGENT_LABEL_PLURAL = `${AGENT_BRAND} Agents`;
const RESERVED_LOCAL_AGENT_ID = "local-pypnm-agent";
const RESERVED_LOCAL_AGENT_TAG = "combined-install";

function normalizeLogLevel(value) {
  switch (typeof value === "string" ? value.trim().toUpperCase() : "") {
    case "DEBUG":
      return "DEBUG";
    case "WARN":
    case "WARNING":
      return "WARN";
    case "ERROR":
      return "ERROR";
    case "OFF":
      return "OFF";
    case "INFO":
    default:
      return "INFO";
  }
}

function normalizeHealthPath(value, fallback = "/health") {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw === "") {
    return fallback;
  }
  if (raw.startsWith("/")) {
    return raw;
  }
  return `/${raw}`;
}

export function isReservedLocalAgentInstance(instance) {
  if (!instance || instance.id !== RESERVED_LOCAL_AGENT_ID) {
    return false;
  }
  return Array.isArray(instance.tags) && instance.tags.includes(RESERVED_LOCAL_AGENT_TAG);
}

export function hasReservedLocalAgent(config) {
  const instances = Array.isArray(config?.instances) ? config.instances : [];
  return instances.some((instance) => isReservedLocalAgentInstance(instance));
}

function interactiveAllowed() {
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    return false;
  }
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function repoRootFromModule(metaUrl) {
  return path.resolve(path.dirname(fileURLToPath(metaUrl)), "../..");
}

export function configPathFromRepoRoot(repoRoot) {
  return path.join(repoRoot, "public", "config", "pypnm-instances.local.yaml");
}

export function templateConfigPathFromRepoRoot(repoRoot) {
  return path.join(repoRoot, "public", "config", "pypnm-instances.yaml");
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function dedupeInstances(instances, sourceLabel) {
  const nextInstances = Array.isArray(instances) ? instances : [];
  const seenIds = new Set();
  const duplicateIds = new Set();
  const deduped = [];

  for (const instance of nextInstances) {
    const instanceId = typeof instance?.id === "string" ? instance.id.trim() : "";
    if (instanceId === "") {
      deduped.push(instance);
      continue;
    }

    if (seenIds.has(instanceId)) {
      duplicateIds.add(instanceId);
      continue;
    }

    seenIds.add(instanceId);
    deduped.push(instance);
  }

  if (duplicateIds.size > 0) {
    console.warn(
      `Duplicate ${AGENT_BRAND} agent ids found in ${sourceLabel}: ${Array.from(duplicateIds).join(", ")}. Keeping first occurrence only.`,
    );
  }

  return deduped;
}

function sanitizeConfig(raw, sourceLabel) {
  return {
    ...(raw ?? {}),
    instances: dedupeInstances(raw?.instances, sourceLabel),
  };
}

export function normalizeChannelIds(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => Number.isInteger(item));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "0") {
      return [];
    }
    return trimmed
      .split(",")
      .map((item) => Number.parseInt(item.trim(), 10))
      .filter((item) => Number.isInteger(item) && item >= 0);
  }
  return [];
}

function channelIdsToPromptValue(value) {
  const normalized = normalizeChannelIds(value);
  return normalized.length === 0 ? "0" : normalized.join(",");
}

function normalizeInstance(instance, defaults) {
  return {
    id: typeof instance?.id === "string" && instance.id.trim() !== "" ? instance.id.trim() : "default",
    label: typeof instance?.label === "string" && instance.label.trim() !== "" ? instance.label.trim() : "Default",
    base_url: normalizeBaseUrl(instance?.base_url, "http://127.0.0.1:8080"),
    enabled: instance?.enabled ?? true,
    tags: Array.isArray(instance?.tags) ? instance.tags.filter((item) => typeof item === "string") : [],
    capabilities: Array.isArray(instance?.capabilities)
      ? instance.capabilities.filter((item) => typeof item === "string")
      : ["health", "analysis"],
    polling: {
      enabled: instance?.polling?.enabled ?? true,
      interval_ms: Number.isInteger(instance?.polling?.interval_ms)
        ? instance.polling.interval_ms
        : defaults.poll_interval_ms,
    },
    request_defaults: {
      cable_modem: {
        mac_address: instance?.request_defaults?.cable_modem?.mac_address ?? "",
        ip_address: instance?.request_defaults?.cable_modem?.ip_address ?? "",
      },
      tftp: {
        ipv4: instance?.request_defaults?.tftp?.ipv4 ?? "",
        ipv6: instance?.request_defaults?.tftp?.ipv6 ?? "",
      },
      capture: {
        channel_ids: normalizeChannelIds(instance?.request_defaults?.capture?.channel_ids),
      },
      snmp: {
        rw_community: instance?.request_defaults?.snmp?.rw_community ?? "private",
      },
    },
  };
}

function normalizeUrlCandidate(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw === "") {
    return "";
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) {
    return raw;
  }
  return `http://${raw}`;
}

export function tryNormalizeBaseUrl(value) {
  const candidate = normalizeUrlCandidate(value);
  if (candidate === "") {
    return {
      ok: false,
      value: "",
      error: "Base URL is required.",
    };
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      ok: false,
      value: "",
      error: "Base URL must be a valid URL (for example http://127.0.0.1:8000).",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      value: "",
      error: "Base URL must use http or https.",
    };
  }

  if (!parsed.hostname) {
    return {
      ok: false,
      value: "",
      error: "Base URL must include a hostname.",
    };
  }

  parsed.pathname = "";
  parsed.search = "";
  parsed.hash = "";

  return {
    ok: true,
    value: parsed.toString().replace(/\/$/, ""),
  };
}

export function normalizeBaseUrl(value, fallback = "http://127.0.0.1:8080") {
  const normalized = tryNormalizeBaseUrl(value);
  if (normalized.ok) {
    return normalized.value;
  }
  return fallback;
}

export function normalizeConfig(raw) {
  const base = cloneValue(DEFAULT_CONFIG);
  const defaults = {
    selected_instance:
      typeof raw?.defaults?.selected_instance === "string" && raw.defaults.selected_instance.trim() !== ""
        ? raw.defaults.selected_instance.trim()
        : base.defaults.selected_instance,
    poll_interval_ms:
      Number.isInteger(raw?.defaults?.poll_interval_ms) && raw.defaults.poll_interval_ms > 0
        ? raw.defaults.poll_interval_ms
        : base.defaults.poll_interval_ms,
    request_timeout_ms:
      Number.isInteger(raw?.defaults?.request_timeout_ms) && raw.defaults.request_timeout_ms > 0
        ? raw.defaults.request_timeout_ms
        : base.defaults.request_timeout_ms,
    health_path:
      normalizeHealthPath(raw?.defaults?.health_path, base.defaults.health_path),
    logging: {
      level: normalizeLogLevel(raw?.defaults?.logging?.level ?? base.defaults.logging.level),
    },
  };

  const instances = Array.isArray(raw?.instances)
    ? raw.instances.map((instance) => normalizeInstance(instance, defaults))
    : base.instances.map((instance) => normalizeInstance(instance, defaults));

  if (instances.length > 0 && !instances.some((instance) => instance.id === defaults.selected_instance)) {
    defaults.selected_instance = instances[0].id;
  }

  return {
    version: Number.isInteger(raw?.version) && raw.version > 0 ? raw.version : 1,
    defaults,
    instances,
  };
}

function validateConfig(config) {
  if (!config || typeof config !== "object") {
    return "Config is missing or invalid.";
  }

  if (!Number.isInteger(config?.defaults?.poll_interval_ms) || config.defaults.poll_interval_ms <= 0) {
    return "defaults.poll_interval_ms must be a positive integer.";
  }

  if (!Number.isInteger(config?.defaults?.request_timeout_ms) || config.defaults.request_timeout_ms <= 0) {
    return "defaults.request_timeout_ms must be a positive integer.";
  }

  const normalizedHealthPath = normalizeHealthPath(config?.defaults?.health_path, "/health");
  if (typeof config?.defaults?.health_path !== "string" || config.defaults.health_path !== normalizedHealthPath) {
    return "defaults.health_path must start with '/'.";
  }

  if (!Array.isArray(config?.instances)) {
    return "instances must be an array.";
  }

  const ids = new Set();
  for (const instance of config.instances) {
    const id = typeof instance?.id === "string" ? instance.id.trim() : "";
    if (id === "") {
      return "Every instance must have a non-empty id.";
    }
    if (ids.has(id)) {
      return `Duplicate instance id found: ${id}`;
    }
    ids.add(id);

    const url = tryNormalizeBaseUrl(instance?.base_url);
    if (!url.ok) {
      return `Invalid base_url for instance '${id}': ${url.error}`;
    }
  }

  const selectedId = typeof config?.defaults?.selected_instance === "string"
    ? config.defaults.selected_instance.trim()
    : "";
  if (config.instances.length > 0 && (selectedId === "" || !ids.has(selectedId))) {
    return "defaults.selected_instance must reference an existing instance id.";
  }

  return null;
}

function loadConfig(configPath, fallbackPath) {
  if (!fs.existsSync(configPath)) {
    if (fallbackPath && fs.existsSync(fallbackPath)) {
      const fallbackRaw = sanitizeConfig(parse(fs.readFileSync(fallbackPath, "utf8")) ?? {}, fallbackPath);
      return normalizeConfig(fallbackRaw);
    }
    return cloneValue(DEFAULT_CONFIG);
  }
  const raw = sanitizeConfig(parse(fs.readFileSync(configPath, "utf8")) ?? {}, configPath);
  return normalizeConfig(raw);
}

function backupPathFor(configPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${configPath}.${timestamp}.bak`;
}

export function saveConfig(configPath, config) {
  const validationError = validateConfig(config);
  if (validationError) {
    throw new Error(validationError);
  }
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const nextContent = stringify(config, { indent: 2 });
  if (fs.existsSync(configPath)) {
    const currentContent = fs.readFileSync(configPath, "utf8");
    if (currentContent !== nextContent) {
      fs.copyFileSync(configPath, backupPathFor(configPath));
    }
  }
  fs.writeFileSync(configPath, nextContent, "utf8");
}

export function ensureLocalRuntimeConfig(configPath, fallbackPath) {
  if (fs.existsSync(configPath)) {
    return {
      config: loadConfig(configPath, fallbackPath),
      generated: false,
    };
  }

  const config = loadConfig(configPath, fallbackPath);
  saveConfig(configPath, config);
  return {
    config,
    generated: true,
  };
}

function printConfig(configPath, config) {
  process.stdout.write(`\nConfig Path: ${configPath}\n`);
  process.stdout.write(`${stringify(config, { indent: 2 })}\n`);
}

export function buildRuntimeConfigSchemaExample() {
  return {
    version: 1,
    defaults: {
      selected_instance: "pypnm-agent-1",
      poll_interval_ms: 5000,
      request_timeout_ms: 30000,
      health_path: "/health",
      logging: {
        level: "INFO",
      },
    },
    instances: [],
  };
}

function printRuntimeConfigSchema() {
  process.stdout.write("\nRuntime Config Schema (Minimal)\n===============================\n");
  process.stdout.write(`${stringify(buildRuntimeConfigSchemaExample(), { indent: 2 })}\n`);
  process.stdout.write(
    [
      "Optional instance entry shape:",
      "- id: pypnm-agent-1",
      "  label: pypnm-agent-1",
      "  base_url: http://127.0.0.1:8000",
      "  enabled: true",
      "  tags: []",
      "  capabilities:",
      "    - health",
      "    - analysis",
      "  polling:",
      "    enabled: true",
      "    interval_ms: 5000",
      "  request_defaults:",
      "    cable_modem:",
      "      mac_address: \"\"",
      "      ip_address: \"\"",
      "    tftp:",
      "      ipv4: \"\"",
      "      ipv6: \"\"",
      "    capture:",
      "      channel_ids: []",
      "    snmp:",
      "      rw_community: private",
      "",
    ].join("\n"),
  );
}

function slugifyId(value) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "agent";
}

async function promptLine(rl, label, current = "") {
  const suffix = current !== "" ? ` [${current}]` : "";
  const answer = (await rl.question(`${label}${suffix}: `)).trim();
  return answer === "" ? current : answer;
}

async function promptNumber(rl, label, current) {
  while (true) {
    const answer = (await rl.question(`${label} [${current}]: `)).trim();
    if (answer === "") {
      return current;
    }
    const parsed = Number.parseInt(answer, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
    process.stdout.write("Enter a positive integer.\n");
  }
}

async function promptBoolean(rl, label, current) {
  while (true) {
    const currentLabel = current ? "y" : "n";
    const answer = (await rl.question(`${label} [${currentLabel}] (y/n): `)).trim().toLowerCase();
    if (answer === "") {
      return current;
    }
    if (["y", "yes", "true", "1"].includes(answer)) {
      return true;
    }
    if (["n", "no", "false", "0"].includes(answer)) {
      return false;
    }
    process.stdout.write("Enter y or n.\n");
  }
}

async function promptCsv(rl, label, currentValues) {
  const current = currentValues.join(",");
  const answer = (await rl.question(`${label}${current !== "" ? ` [${current}]` : ""}: `)).trim();
  if (answer === "") {
    return currentValues;
  }
  return answer
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

async function promptBaseUrl(rl, current) {
  while (true) {
    const answer = await promptLine(rl, "Base URL", current);
    const normalized = tryNormalizeBaseUrl(answer);
    if (normalized.ok) {
      return normalized.value;
    }
    process.stdout.write(`${normalized.error}\n`);
  }
}

export async function promptSelectedInstance(rl, instances, currentInstanceId) {
  if (!Array.isArray(instances) || instances.length === 0) {
    process.stdout.write("No configured agents available; keeping current selected_instance.\n");
    return currentInstanceId;
  }
  process.stdout.write("\nAvailable selected_instance values:\n");
  instances.forEach((instance, index) => {
    process.stdout.write(`${index + 1}) ${instance.id} | ${instance.label}\n`);
  });

  const currentIndex = Math.max(
    1,
    instances.findIndex((instance) => instance.id === currentInstanceId) + 1,
  );

  while (true) {
    const answer = (await rl.question(`Selected instance [${currentIndex}]: `)).trim();
    if (answer === "") {
      return instances[currentIndex - 1]?.id ?? currentInstanceId;
    }

    const numericSelection = Number.parseInt(answer, 10);
    if (Number.isInteger(numericSelection) && numericSelection >= 1 && numericSelection <= instances.length) {
      return instances[numericSelection - 1].id;
    }

    const directMatch = instances.find((instance) => instance.id === answer);
    if (directMatch) {
      return directMatch.id;
    }

    process.stdout.write("Enter a listed number or a valid instance id.\n");
  }
}

async function editRuntimeDefaults(rl, config) {
  process.stdout.write("\nRuntime Defaults\n================\n");
  config.defaults.poll_interval_ms = await promptNumber(rl, "Default poll interval ms", config.defaults.poll_interval_ms);
  config.defaults.request_timeout_ms = await promptNumber(rl, "Request timeout ms", config.defaults.request_timeout_ms);
  config.defaults.health_path = normalizeHealthPath(
    await promptLine(rl, "Health path", config.defaults.health_path),
    config.defaults.health_path,
  );
  config.defaults.logging.level = await promptLine(rl, "Logging level (DEBUG/INFO/WARN/ERROR/OFF)", config.defaults.logging.level);
  config.defaults.logging.level = normalizeLogLevel(config.defaults.logging.level);
  if (config.instances.length === 0) {
    process.stdout.write("No configured agents found. Add an agent before changing selected_instance.\n");
  } else {
    config.defaults.selected_instance = await promptSelectedInstance(rl, config.instances, config.defaults.selected_instance);
  }
}

async function addAgent(rl, config) {
  process.stdout.write(`\nAdd ${AGENT_LABEL_SINGULAR}\n===============\n`);
  const hadNoInstances = config.instances.length === 0;
  const label = await promptLine(rl, "Agent label", "");
  const id = await promptLine(rl, "Agent id", slugifyId(label));
  const baseUrl = await promptBaseUrl(rl, "http://127.0.0.1:8080");
  const enabled = await promptBoolean(rl, "Enabled", true);
  const tags = await promptCsv(rl, "Tags (comma-separated)", []);
  const capabilities = await promptCsv(rl, "Capabilities (comma-separated)", ["health", "analysis"]);
  const pollingEnabled = await promptBoolean(rl, "Polling enabled", true);
  const pollingInterval = await promptNumber(rl, "Polling interval ms", config.defaults.poll_interval_ms);
  const cableModemIp = await promptLine(rl, "Default cable modem IP", "");
  const tftpIpv4 = await promptLine(rl, "Default TFTP IPv4", "");
  const tftpIpv6 = await promptLine(rl, "Default TFTP IPv6", "");
  const channelIds = await promptLine(rl, "Default channel ids (0 means all)", "0");
  const snmpRwCommunity = await promptLine(rl, "Default SNMP RW community", "private");

  const existingIndex = config.instances.findIndex((instance) => instance.id === id);
  if (hasReservedLocalAgent(config) && id === RESERVED_LOCAL_AGENT_ID) {
    process.stdout.write(
      "The agent id local-pypnm-agent is reserved for combined install. Use a different id.\n",
    );
    return;
  }
  const agent = {
    id,
    label: label || id,
    base_url: baseUrl,
    enabled,
    tags,
    capabilities,
    polling: {
      enabled: pollingEnabled,
      interval_ms: pollingInterval,
    },
    request_defaults: {
      cable_modem: {
        mac_address: "",
        ip_address: cableModemIp,
      },
      tftp: {
        ipv4: tftpIpv4,
        ipv6: tftpIpv6,
      },
      capture: {
        channel_ids: normalizeChannelIds(channelIds),
      },
      snmp: {
        rw_community: snmpRwCommunity,
      },
    },
  };

  if (existingIndex >= 0) {
    config.instances[existingIndex] = agent;
  } else {
    config.instances.push(agent);
  }

  if (hadNoInstances || !config.defaults.selected_instance) {
    config.defaults.selected_instance = agent.id;
  }
}

async function editAgent(rl, config) {
  if (config.instances.length === 0) {
    process.stdout.write("No agents configured.\n");
    return;
  }

  process.stdout.write("\nConfigured Agents\n=================\n");
  config.instances.forEach((instance, index) => {
    process.stdout.write(`${index + 1}) ${instance.id} | ${instance.label} | ${instance.base_url}\n`);
  });

  const answer = (await rl.question("Select agent number: ")).trim();
  const index = Number.parseInt(answer, 10) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= config.instances.length) {
    process.stdout.write("Invalid selection.\n");
    return;
  }

  const instance = config.instances[index];
  const priorId = instance.id;
  const reservedActive = hasReservedLocalAgent(config);
  const editingReservedInstance = isReservedLocalAgentInstance(instance);
  instance.label = await promptLine(rl, "Agent label", instance.label);
  if (editingReservedInstance) {
    process.stdout.write(
      "Agent id local-pypnm-agent is reserved for combined install and cannot be changed.\n",
    );
  } else {
    const nextId = await promptLine(rl, "Agent id", instance.id);
    if (reservedActive && nextId === RESERVED_LOCAL_AGENT_ID) {
      process.stdout.write(
        "The agent id local-pypnm-agent is reserved for combined install. Use a different id.\n",
      );
      return;
    }
    if (nextId !== priorId && config.instances.some((candidate) => candidate.id === nextId)) {
      process.stdout.write(`Agent id ${nextId} already exists. Choose a unique id.\n`);
      return;
    }
    instance.id = nextId;
  }
  instance.base_url = await promptBaseUrl(rl, instance.base_url);
  instance.enabled = await promptBoolean(rl, "Enabled", instance.enabled);
  instance.tags = await promptCsv(rl, "Tags (comma-separated)", instance.tags);
  instance.capabilities = await promptCsv(rl, "Capabilities (comma-separated)", instance.capabilities);
  instance.polling.enabled = await promptBoolean(rl, "Polling enabled", instance.polling.enabled);
  instance.polling.interval_ms = await promptNumber(rl, "Polling interval ms", instance.polling.interval_ms);
  instance.request_defaults.cable_modem.mac_address = "";
  instance.request_defaults.cable_modem.ip_address = await promptLine(
    rl,
    "Default cable modem IP",
    instance.request_defaults.cable_modem.ip_address,
  );
  instance.request_defaults.tftp.ipv4 = await promptLine(
    rl,
    "Default TFTP IPv4",
    instance.request_defaults.tftp.ipv4,
  );
  instance.request_defaults.tftp.ipv6 = await promptLine(
    rl,
    "Default TFTP IPv6",
    instance.request_defaults.tftp.ipv6,
  );
  const channelIds = await promptLine(
    rl,
    "Default channel ids (0 means all)",
    channelIdsToPromptValue(instance.request_defaults.capture.channel_ids),
  );
  instance.request_defaults.capture.channel_ids = normalizeChannelIds(channelIds);
  instance.request_defaults.snmp.rw_community = await promptLine(
    rl,
    "Default SNMP RW community",
    instance.request_defaults.snmp.rw_community,
  );

  if (config.defaults.selected_instance === priorId) {
    config.defaults.selected_instance = instance.id;
  }
}

async function deleteAgent(rl, config) {
  if (config.instances.length <= 1) {
    process.stdout.write("At least one agent must remain configured.\n");
    return;
  }

  process.stdout.write("\nConfigured Agents\n=================\n");
  config.instances.forEach((instance, index) => {
    process.stdout.write(`${index + 1}) ${instance.id} | ${instance.label}\n`);
  });

  const answer = (await rl.question("Delete agent number: ")).trim();
  const index = Number.parseInt(answer, 10) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= config.instances.length) {
    process.stdout.write("Invalid selection.\n");
    return;
  }
  if (isReservedLocalAgentInstance(config.instances[index])) {
    process.stdout.write(
      "The local-pypnm-agent entry is reserved for combined install and cannot be deleted.\n",
    );
    return;
  }

  const [removed] = config.instances.splice(index, 1);
  if (config.defaults.selected_instance === removed.id) {
    config.defaults.selected_instance = config.instances[0]?.id ?? DEFAULT_CONFIG.defaults.selected_instance;
  }
}

async function manageAgents(rl, config, configPath) {
  while (true) {
    process.stdout.write(
      [
        `\n${AGENT_LABEL_PLURAL}`,
        "============",
        "1) Add agent",
        "2) Edit agent",
        "3) Delete agent",
        "s) Show local runtime YAML schema",
        "p) Print current YAML",
        "b) Back",
      ].join("\n") + "\n",
    );

    const choice = (await rl.question("Enter selection: ")).trim().toLowerCase();
    if (choice === "" || choice === "b" || choice === "back") {
      return;
    }
    if (choice === "1") {
      await addAgent(rl, config);
      try {
        saveConfig(configPath, config);
        process.stdout.write(`Saved ${configPath}\n`);
      } catch (error) {
        process.stdout.write(`Config validation failed: ${error instanceof Error ? error.message : String(error)}\n`);
      }
      continue;
    }
    if (choice === "2") {
      await editAgent(rl, config);
      try {
        saveConfig(configPath, config);
        process.stdout.write(`Saved ${configPath}\n`);
      } catch (error) {
        process.stdout.write(`Config validation failed: ${error instanceof Error ? error.message : String(error)}\n`);
      }
      continue;
    }
    if (choice === "3") {
      await deleteAgent(rl, config);
      try {
        saveConfig(configPath, config);
        process.stdout.write(`Saved ${configPath}\n`);
      } catch (error) {
        process.stdout.write(`Config validation failed: ${error instanceof Error ? error.message : String(error)}\n`);
      }
      continue;
    }
    if (choice === "p") {
      printConfig("public/config/pypnm-instances.local.yaml", config);
      continue;
    }
    if (choice === "s") {
      printRuntimeConfigSchema();
      continue;
    }
    process.stdout.write("Invalid selection.\n");
  }
}

export async function runConfigMenu(metaUrl) {
  if (!interactiveAllowed()) {
    process.stdout.write("Config menu requires an interactive terminal; skipping.\n");
    return 0;
  }

  const repoRoot = repoRootFromModule(metaUrl);
  const configPath = configPathFromRepoRoot(repoRoot);
  const templatePath = templateConfigPathFromRepoRoot(repoRoot);
  const config = loadConfig(configPath, templatePath);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    while (true) {
      process.stdout.write(
        [
          "\nPyPNM-CMTS-WebUI Config Menu",
          "============================",
          "1) Edit runtime defaults",
          "2) Manage PyPNM-CMTS agents",
          "s) Show local runtime YAML schema",
          "p) Print current pypnm-instances.local.yaml",
          "q) Quit",
        ].join("\n") + "\n",
      );

      const choice = (await rl.question("Enter selection: ")).trim().toLowerCase();

      if (choice === "" || choice === "q" || choice === "quit" || choice === "x") {
        process.stdout.write("Exiting config menu.\n");
        return 0;
      }
      if (choice === "1") {
        await editRuntimeDefaults(rl, config);
        try {
          saveConfig(configPath, config);
          process.stdout.write(`Saved ${configPath}\n`);
        } catch (error) {
          process.stdout.write(`Config validation failed: ${error instanceof Error ? error.message : String(error)}\n`);
        }
        continue;
      }
      if (choice === "2") {
        await manageAgents(rl, config, configPath);
        continue;
      }
      if (choice === "p") {
        printConfig(configPath, config);
        continue;
      }
      if (choice === "s") {
        printRuntimeConfigSchema();
        continue;
      }
      process.stdout.write("Invalid selection.\n");
    }
  } finally {
    rl.close();
  }
}
