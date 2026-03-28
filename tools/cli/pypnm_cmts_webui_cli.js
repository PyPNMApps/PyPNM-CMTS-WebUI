import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import packageJson from "../../package.json" with { type: "json" };
import {
  configPathFromRepoRoot,
  ensureLocalRuntimeConfig,
  runConfigMenu,
  templateConfigPathFromRepoRoot,
} from "../config-menu/config_menu.js";

const SUCCESS_EXIT_CODE = 0;
const EXIT_CODE_USAGE = 2;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4175;
const DEFAULT_LOG_LEVEL = "info";
const VALID_LOG_LEVELS = new Set(["silent", "error", "warn", "info"]);
const RESERVED_LOCAL_AGENT_ID = "local-pypnm-agent";
const RESERVED_LOCAL_AGENT_TAG = "combined-install";
const LOCAL_AGENT_PRECHECK_TIMEOUT_MS = 3000;
const LOCAL_AGENT_STARTUP_TIMEOUT_MS = 6000;

function repoRootFromModule(metaUrl) {
  const cliDir = path.dirname(fileURLToPath(metaUrl));
  return path.resolve(cliDir, "../..");
}

function readCliVersion(metaUrl) {
  const repoRoot = repoRootFromModule(metaUrl);
  const versionPath = path.join(repoRoot, "VERSION");
  try {
    const version = fs.readFileSync(versionPath, "utf8").trim();
    if (version) {
      return version;
    }
  } catch {
    // fall through to package.json version
  }
  return packageJson.version;
}

function printRootHelp() {
  process.stdout.write(
    [
      "PyPNM-WebUI CLI for local development and preview workflows.",
      "",
      "Usage:",
      "  pypnm-webui <command> [options]",
      "",
      "Commands:",
      "  serve        Start the Vite development server.",
      "  config-menu  Launch the interactive pypnm-instances.yaml editor.",
      "  start-local-stack  Start local pypnm-docsis and WebUI together.",
      "  kill-pypnm-webui  List or stop running local PyPNM-WebUI processes.",
      "",
      "Options:",
      "  -h, --help   Show this help.",
      "  -v, --version Show version and exit.",
      "",
      "Examples:",
      "  pypnm-webui serve",
      "  pypnm-webui serve --host 0.0.0.0 --port 4175",
      "  pypnm-webui serve --open",
      "  pypnm-webui config-menu",
      "  pypnm-webui start-local-stack",
      "",
      'Use "pypnm-webui <command> --help" for command-specific options.',
      "",
    ].join("\n"),
  );
}

function printServeHelp() {
  process.stdout.write(
    [
      "Start the PyPNM-WebUI Vite development server.",
      "",
      "Usage:",
      "  pypnm-webui serve [options]",
      "",
      "Options:",
      `  --host <host>        Host to bind (default: ${DEFAULT_HOST})`,
      `  --port <port>        Port to bind (default: ${DEFAULT_PORT})`,
      "  --open               Open the browser on startup.",
      "  --strict-port        Exit if the port is already in use.",
      "  --start-local-pypnm-docsis",
      "                       Start local pypnm-docsis for selected local-pypnm-agent.",
      `  --log-level <level>  Vite log level: ${Array.from(VALID_LOG_LEVELS).join(", ")} (default: ${DEFAULT_LOG_LEVEL})`,
      "  --mode <mode>        Vite mode override.",
      "  --base <path>        Public base path override.",
      "  -h, --help           Show this help.",
      "",
      "Examples:",
      "  pypnm-webui serve",
      "  pypnm-webui serve --host 0.0.0.0 --port 4175",
      "  pypnm-webui serve --strict-port --log-level warn",
      "",
    ].join("\n"),
  );
}

function printConfigMenuHelp() {
  process.stdout.write(
    [
      "Launch the interactive pypnm-instances.yaml configuration menu.",
      "",
      "Usage:",
      "  pypnm-webui config-menu",
      "",
      "Behavior:",
      "  - edits public/config/pypnm-instances.local.yaml",
      "  - manages PyPNM agent entries",
      "  - edits per-agent request defaults like MAC, IP, TFTP, and SNMP RW community",
      "  - saves after each edit",
      "  - creates a timestamped backup before overwriting prior config content",
      "",
    ].join("\n"),
  );
}

function printStartLocalStackHelp() {
  process.stdout.write(
    [
      "Start local pypnm-docsis and PyPNM-WebUI together.",
      "",
      "Usage:",
      "  pypnm-webui start-local-stack [options]",
      "",
      "Options:",
      "  --api-host <host>     Bind host for both backend and WebUI (default: 0.0.0.0)",
      "  --api-port <port>     Backend bind port (default: 8000)",
      "  --webui-host <host>   Deprecated alias for --api-host.",
      "  --webui-port <port>   WebUI bind port (default: 4175)",
      "  --reload-api          Enable PyPNM auto-reload.",
      "",
    ].join("\n"),
  );
}

function printKillWebUiHelp() {
  process.stdout.write(
    [
      "List or stop local PyPNM-WebUI processes for this repo.",
      "",
      "Usage:",
      "  pypnm-webui kill-pypnm-webui --list",
      "  pypnm-webui kill-pypnm-webui --kill [INDEX_OR_PID]",
      "  pypnm-webui kill-pypnm-webui --kill-all",
      "",
      "Behavior:",
      "  - matches running PyPNM-WebUI / Vite processes for this repo only",
      "  - --kill with no argument shows numbered entries and prompts for a selection",
      "  - --kill accepts either a list index or an exact PID",
      "",
    ].join("\n"),
  );
}

function failUsage(message) {
  process.stderr.write(`ERROR: ${message}\n`);
  return EXIT_CODE_USAGE;
}

export function parseServeArgs(args) {
  const options = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    open: false,
    strictPort: false,
    startLocalPyPnmDocsis: false,
    logLevel: DEFAULT_LOG_LEVEL,
    mode: "",
    base: "",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-h" || arg === "--help") {
      printServeHelp();
      return { exitCode: SUCCESS_EXIT_CODE };
    }

    if (arg === "--open") {
      options.open = true;
      continue;
    }

    if (arg === "--strict-port") {
      options.strictPort = true;
      continue;
    }

    if (arg === "--start-local-pypnm-docsis") {
      options.startLocalPyPnmDocsis = true;
      continue;
    }

    if (arg === "--host" || arg === "--port" || arg === "--log-level" || arg === "--mode" || arg === "--base") {
      const next = args[index + 1];
      if (!next || next.startsWith("-")) {
        return { exitCode: failUsage(`Missing value for ${arg}`) };
      }

      if (arg === "--host") {
        options.host = next;
      } else if (arg === "--port") {
        const parsedPort = Number.parseInt(next, 10);
        if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
          return { exitCode: failUsage(`Invalid port: ${next}`) };
        }
        options.port = parsedPort;
      } else if (arg === "--log-level") {
        if (!VALID_LOG_LEVELS.has(next)) {
          return { exitCode: failUsage(`Invalid log level: ${next}`) };
        }
        options.logLevel = next;
      } else if (arg === "--mode") {
        options.mode = next;
      } else if (arg === "--base") {
        options.base = next;
      }

      index += 1;
      continue;
    }

    return { exitCode: failUsage(`Unknown serve argument: ${arg}`) };
  }

  return { options };
}

function buildViteServeArgs(options) {
  const args = [
    "--host",
    options.host,
    "--port",
    String(options.port),
    "--logLevel",
    options.logLevel,
  ];

  if (options.open) {
    args.push("--open");
  }
  if (options.strictPort) {
    args.push("--strictPort");
  }
  if (options.mode) {
    args.push("--mode", options.mode);
  }
  if (options.base) {
    args.push("--base", options.base);
  }

  return args;
}

function isReservedLocalAgentInstance(instance) {
  if (!instance || instance.id !== RESERVED_LOCAL_AGENT_ID) {
    return false;
  }
  return Array.isArray(instance.tags) && instance.tags.includes(RESERVED_LOCAL_AGENT_TAG);
}

function ensureRuntimeConfig(repoRoot) {
  const runtimeConfigResult = ensureLocalRuntimeConfig(
    configPathFromRepoRoot(repoRoot),
    templateConfigPathFromRepoRoot(repoRoot),
  );
  if (runtimeConfigResult.generated) {
    process.stdout.write(
      "INFO: No runtime YAML config file was found. Generated public/config/pypnm-instances.local.yaml\n",
    );
  }

  return runtimeConfigResult.config;
}

function selectedLocalAgentFromConfig(config) {
  const selectedInstanceId = config?.defaults?.selected_instance ?? "";
  const instances = Array.isArray(config?.instances) ? config.instances : [];
  const localAgent = instances.find((instance) => isReservedLocalAgentInstance(instance));

  return localAgent && selectedInstanceId === RESERVED_LOCAL_AGENT_ID ? localAgent : null;
}

function healthUrlFromConfig(config, localAgent) {
  const baseUrl = String(localAgent.base_url ?? "").trim();
  if (baseUrl === "") {
    return "";
  }
  const healthPath = String(config?.defaults?.health_path ?? "/health").trim() || "/health";
  return new URL(healthPath, baseUrl).toString();
}

function precheckTimeoutMsFromConfig(config) {
  const timeoutMs = Math.max(
    1000,
    Math.min(
      Number.isInteger(config?.defaults?.request_timeout_ms) ? config.defaults.request_timeout_ms : LOCAL_AGENT_PRECHECK_TIMEOUT_MS,
      LOCAL_AGENT_PRECHECK_TIMEOUT_MS,
    ),
  );
  return timeoutMs;
}

async function checkHealthUrl(healthUrl, timeoutMs) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeoutHandle);
    return response.ok;
  } catch {
    clearTimeout(timeoutHandle);
    return false;
  }
}

async function preflightLocalAgent(config) {
  const localAgent = selectedLocalAgentFromConfig(config);
  if (!localAgent) {
    return;
  }
  const baseUrl = String(localAgent.base_url ?? "").trim();
  if (baseUrl === "") {
    process.stderr.write(
      "WARN: local-pypnm-agent is selected but has no base_url. Re-run ./install.sh --with-pypnm-docsis --reconfigure-local-agent\n",
    );
    return;
  }
  let healthUrl = "";
  try {
    healthUrl = healthUrlFromConfig(config, localAgent);
  } catch {
    process.stderr.write(`WARN: local-pypnm-agent base_url is invalid: ${baseUrl}\n`);
    return;
  }
  const ok = await checkHealthUrl(healthUrl, precheckTimeoutMsFromConfig(config));
  if (!ok) {
    process.stderr.write(
      `WARN: local-pypnm-agent is selected but pypnm-docsis is not reachable at ${healthUrl}\n`,
    );
    process.stderr.write("WARN: Start backend with pypnm-webui start-local-stack\n");
  }
}

function resolveBackendCliPath(repoRoot) {
  const primary = path.join(repoRoot, ".venv", "bin", "pypnm");
  if (fs.existsSync(primary)) {
    return primary;
  }
  const fallback = path.join(repoRoot, ".pypnm-venv", "bin", "pypnm");
  if (fs.existsSync(fallback)) {
    return fallback;
  }
  return "";
}

function parseHostPortFromBaseUrl(baseUrl) {
  const parsed = new URL(baseUrl);
  const port = parsed.port !== "" ? Number.parseInt(parsed.port, 10) : (parsed.protocol === "https:" ? 443 : 80);
  return {
    host: parsed.hostname,
    port,
  };
}

async function maybeStartLocalPyPnmDocsis(repoRoot, config, enabled) {
  if (!enabled) {
    return { process: null };
  }
  const localAgent = selectedLocalAgentFromConfig(config);
  if (!localAgent) {
    process.stderr.write(
      "WARN: --start-local-pypnm-docsis ignored because selected instance is not local-pypnm-agent\n",
    );
    return { process: null };
  }
  const baseUrl = String(localAgent.base_url ?? "").trim();
  if (baseUrl === "") {
    process.stderr.write(
      "WARN: --start-local-pypnm-docsis ignored because local-pypnm-agent has no base_url\n",
    );
    return { process: null };
  }

  const backendCli = resolveBackendCliPath(repoRoot);
  if (backendCli === "") {
    process.stderr.write(
      "WARN: backend CLI not found in .venv or .pypnm-venv; run ./install.sh --with-pypnm-docsis\n",
    );
    return { process: null };
  }

  let endpoint;
  let healthUrl;
  try {
    endpoint = parseHostPortFromBaseUrl(baseUrl);
    healthUrl = healthUrlFromConfig(config, localAgent);
  } catch {
    process.stderr.write(`WARN: invalid local-pypnm-agent base_url: ${baseUrl}\n`);
    return { process: null };
  }

  process.stdout.write(
    `INFO: Starting local pypnm-docsis on ${endpoint.host}:${endpoint.port}\n`,
  );
  const backendProcess = spawn(
    backendCli,
    ["serve", "--host", endpoint.host, "--port", String(endpoint.port)],
    {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
    },
  );

  const ok = await checkHealthUrl(healthUrl, LOCAL_AGENT_STARTUP_TIMEOUT_MS);
  if (!ok) {
    process.stderr.write(
      `WARN: pypnm-docsis did not become healthy within ${LOCAL_AGENT_STARTUP_TIMEOUT_MS} ms at ${healthUrl}\n`,
    );
  }

  return { process: backendProcess };
}

async function runServe(options, metaUrl) {
  const repoRoot = repoRootFromModule(metaUrl);
  const config = ensureRuntimeConfig(repoRoot);
  const backendResult = await maybeStartLocalPyPnmDocsis(repoRoot, config, options.startLocalPyPnmDocsis);
  if (!options.startLocalPyPnmDocsis) {
    await preflightLocalAgent(config);
  }

  const cleanupBackend = () => {
    if (backendResult.process && !backendResult.process.killed) {
      backendResult.process.kill("SIGTERM");
    }
  };

  const viteBin = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");
  const viteArgs = buildViteServeArgs(options);
  const child = spawn(process.execPath, [viteBin, ...viteArgs], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    cleanupBackend();
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    cleanupBackend();
    process.stderr.write(`ERROR: Failed to start Vite: ${error.message}\n`);
    process.exit(1);
  });

  return SUCCESS_EXIT_CODE;
}

function runMaintenanceScript(metaUrl, relativeScriptPath, scriptArgs) {
  const repoRoot = repoRootFromModule(metaUrl);
  const scriptPath = path.join(repoRoot, relativeScriptPath);
  const child = spawn("bash", [scriptPath, ...scriptArgs], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    process.stderr.write(`ERROR: Failed to run maintenance script: ${error.message}\n`);
    process.exit(1);
  });

  return SUCCESS_EXIT_CODE;
}

export async function runCli(args, metaUrl) {
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printRootHelp();
    return SUCCESS_EXIT_CODE;
  }

  if (args[0] === "-v" || args[0] === "--version") {
    process.stdout.write(`${readCliVersion(metaUrl)}\n`);
    return SUCCESS_EXIT_CODE;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  if (command === "serve") {
    const parsed = parseServeArgs(commandArgs);
    if ("exitCode" in parsed) {
      return parsed.exitCode;
    }
    await runServe(parsed.options, metaUrl);
    return null;
  }

  if (command === "config-menu") {
    if (commandArgs.includes("-h") || commandArgs.includes("--help")) {
      printConfigMenuHelp();
      return SUCCESS_EXIT_CODE;
    }
    return runConfigMenu(metaUrl);
  }

  if (command === "kill-pypnm-webui") {
    if (commandArgs.includes("-h") || commandArgs.includes("--help")) {
      printKillWebUiHelp();
      return SUCCESS_EXIT_CODE;
    }
    runMaintenanceScript(metaUrl, "tools/maintenance/kill-pypnm-webui.sh", commandArgs);
    return null;
  }

  if (command === "start-local-stack") {
    if (commandArgs.includes("-h") || commandArgs.includes("--help")) {
      printStartLocalStackHelp();
      return SUCCESS_EXIT_CODE;
    }
    runMaintenanceScript(metaUrl, "tools/install/start-local-stack.sh", commandArgs);
    return null;
  }

  return failUsage(`Unknown command: ${command}`);
}
