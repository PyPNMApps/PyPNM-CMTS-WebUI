#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PYPNM_PATH=""
STACK_PID=""
WEBUI_PORT="${WEBUI_PORT:-4175}"

log() {
  printf '[ci][with-pypnm-docsis] %s\n' "$1"
}

fail() {
  printf '[ci][with-pypnm-docsis][error] %s\n' "$1" >&2
  exit 1
}

print_help() {
  cat <<'EOF'
Usage:
  ./tools/install/ci-verify-with-pypnm-docsis.sh --pypnm-path <path>

Options:
  --pypnm-path <path>   Local PyPNM checkout to install from.
  -h, --help            Show this help.
EOF
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --pypnm-path)
        shift
        PYPNM_PATH="${1:-}"
        ;;
      -h|--help)
        print_help
        exit 0
        ;;
      *)
        fail "Unknown argument: $1"
        ;;
    esac
    shift
  done
}

wait_for_url() {
  local url="$1"
  local label="$2"

  for attempt in $(seq 1 60); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      log "${label} is ready at ${url}"
      return 0
    fi
    sleep 2
  done

  fail "${label} failed to become ready at ${url}"
}

verify_runtime_config() {
  log "Verifying generated runtime config"
  node --input-type=module <<'EOF'
import fs from "node:fs";
import { parse } from "yaml";

const configPath = "public/config/pypnm-instances.local.yaml";
const config = parse(fs.readFileSync(configPath, "utf8")) ?? {};
const selected = config?.defaults?.selected_instance;
const instance = Array.isArray(config?.instances)
  ? config.instances.find((entry) => entry?.id === "local-pypnm-agent")
  : null;

if (selected !== "local-pypnm-agent") {
  throw new Error(`Expected defaults.selected_instance to be local-pypnm-agent, received ${selected ?? "undefined"}`);
}

if (!instance) {
  throw new Error("Expected Local PyPNM-CMTS Agent instance to exist.");
}

if (instance.base_url !== "http://127.0.0.1:8000") {
  throw new Error(`Expected Local PyPNM-CMTS Agent base_url to be http://127.0.0.1:8000, received ${instance.base_url ?? "undefined"}`);
}
EOF
}

main() {
  parse_args "$@"

  [ -n "${PYPNM_PATH}" ] || fail "--pypnm-path is required."
  [ -f "${PYPNM_PATH}/pyproject.toml" ] || fail "Invalid PyPNM path: ${PYPNM_PATH}"

  local detected_python_bin=""
  if command -v python >/dev/null 2>&1; then
    detected_python_bin="python"
  elif command -v python3 >/dev/null 2>&1; then
    detected_python_bin="python3"
  else
    fail "Python executable not found (expected python or python3)."
  fi

  cd "${ROOT_DIR}"
  rm -rf .venv .pypnm-venv node_modules public/config/pypnm-instances.local.yaml

  log "Running combined install"
  PYTHON_BIN="${detected_python_bin}" ./install.sh \
    --with-pypnm-docsis \
    --pypnm-docsis-path "${PYPNM_PATH}" \
    --local-api-host 127.0.0.1

  log "Checking installed backend CLI"
  ./.venv/bin/pypnm --version

  verify_runtime_config

  log "Starting combined local stack"
  ./tools/install/start-local-stack.sh --api-host 127.0.0.1 > /tmp/pypnm-webui-stack.log 2>&1 &
  STACK_PID="$!"

  cleanup() {
    if [ -n "${STACK_PID}" ] && kill -0 "${STACK_PID}" >/dev/null 2>&1; then
      kill "${STACK_PID}" >/dev/null 2>&1 || true
      wait "${STACK_PID}" 2>/dev/null || true
    fi
  }

  trap cleanup EXIT INT TERM

  wait_for_url "http://127.0.0.1:8000/health" "PyPNM health endpoint"
  wait_for_url "http://127.0.0.1:${WEBUI_PORT}" "PyPNM-CMTS-WebUI dev server"

  log "Running live WebUI health integration test against installed stack"
  RUN_LIVE_PYPNM_HEALTH=1 \
  PYPNM_LIVE_BASE_URL="http://127.0.0.1:8000" \
  PYPNM_LIVE_HEALTH_PATH="/health" \
  npm run test:integration
}

main "$@"
