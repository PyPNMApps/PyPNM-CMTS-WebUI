#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_HOST="0.0.0.0"
API_PORT="8000"
PRODUCT_PROFILE=""
PROFILE_PW="pypnm-webui"
PROFILE_PCW="pypnm-cmts-webui"
WEBUI_CLI_SCRIPT=""
WEBUI_PORT=""
API_RELOAD=0
RUN_BACKGROUND=0
STACK_STATE_DIR="${ROOT_DIR}/.pypnm-local-stack"
BACKEND_PID_FILE="${STACK_STATE_DIR}/backend.pid"
WEBUI_PID_FILE="${STACK_STATE_DIR}/webui.pid"
BACKEND_LOG_FILE="${STACK_STATE_DIR}/backend.log"
WEBUI_LOG_FILE="${STACK_STATE_DIR}/webui.log"

print_help() {
  cat <<'EOF'
Usage:
  ./tools/install/start-local-stack.sh [options]

Options:
  --api-host <host>     Bind host for both backend and WebUI (default: 0.0.0.0)
  --api-port <port>     Backend bind port (default: 8000)
  --webui-host <host>   Deprecated alias for --api-host (kept for compatibility)
  --webui-port <port>   WebUI bind port (default: 4175)
  --reload-api          Enable PyPNM auto-reload.
  --run-background      Start backend and WebUI detached, then exit.
  -h, --help            Show this help.
EOF
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --api-host)
        shift
        API_HOST="${1:-}"
        ;;
      --api-port)
        shift
        API_PORT="${1:-}"
        ;;
      --webui-host)
        shift
        API_HOST="${1:-}"
        ;;
      --webui-port)
        shift
        WEBUI_PORT="${1:-}"
        ;;
      --reload-api)
        API_RELOAD=1
        ;;
      --run-background)
        RUN_BACKGROUND=1
        ;;
      -h|--help)
        print_help
        exit 0
        ;;
      *)
        printf 'ERROR: Unknown argument: %s\n' "$1" >&2
        exit 2
        ;;
    esac
    shift
  done
}

read_env_value() {
  local key="$1"
  local env_path="${ROOT_DIR}/.env"
  if [ ! -f "${env_path}" ]; then
    return
  fi
  sed -n "s/^${key}=//p" "${env_path}" | tail -n1
}

resolve_profile_defaults() {
  PRODUCT_PROFILE="${PRODUCT_PROFILE:-$(read_env_value "PRODUCT_PROFILE" || true)}"
  if [ -z "${PRODUCT_PROFILE}" ]; then
    PRODUCT_PROFILE="${PROFILE_PCW}"
  fi

  case "${PRODUCT_PROFILE}" in
    "${PROFILE_PW}")
      WEBUI_CLI_SCRIPT="${ROOT_DIR}/tools/cli/pypnm-webui.js"
      if [ -z "${WEBUI_PORT}" ]; then
        WEBUI_PORT="4173"
      fi
      ;;
    "${PROFILE_PCW}")
      WEBUI_CLI_SCRIPT="${ROOT_DIR}/tools/cli/pypnm-cmts-webui.js"
      if [ -z "${WEBUI_PORT}" ]; then
        WEBUI_PORT="4175"
      fi
      ;;
    *)
      printf 'ERROR: Unsupported PRODUCT_PROFILE value in .env: %s\n' "${PRODUCT_PROFILE}" >&2
      exit 2
      ;;
  esac

  if [ ! -x "${WEBUI_CLI_SCRIPT}" ]; then
    local fallback_cli="${ROOT_DIR}/tools/cli/pypnm-cmts-webui.js"
    if [ -x "${fallback_cli}" ]; then
      WEBUI_CLI_SCRIPT="${fallback_cli}"
    else
      printf 'ERROR: WebUI CLI script not found: %s\n' "${WEBUI_CLI_SCRIPT}" >&2
      exit 1
    fi
  fi
}

main() {
  parse_args "$@"
  resolve_profile_defaults

  local backend_cli="${ROOT_DIR}/.venv/bin/pypnm"
  if [ ! -x "${backend_cli}" ] && [ -x "${ROOT_DIR}/.pypnm-venv/bin/pypnm" ]; then
    # Backward-compatible fallback for older combined installs.
    backend_cli="${ROOT_DIR}/.pypnm-venv/bin/pypnm"
  fi
  if [ ! -x "${backend_cli}" ]; then
    printf 'ERROR: backend CLI not found in .venv (legacy fallback: .pypnm-venv). Run install with a matching profile/backend pair first (for example: ./install.sh --with-pypnm-cmts-webui --with-pypnm-docsis-cmts).\n' >&2
    exit 1
  fi

  local backend_args=("serve" "--host" "${API_HOST}" "--port" "${API_PORT}")
  if [ "${API_RELOAD}" -eq 1 ]; then
    backend_args+=("--reload")
  fi

  cd "${ROOT_DIR}"
  if [ "${RUN_BACKGROUND}" -eq 1 ]; then
    mkdir -p "${STACK_STATE_DIR}"
    rm -f "${BACKEND_PID_FILE}" "${WEBUI_PID_FILE}"

    "${backend_cli}" "${backend_args[@]}" >"${BACKEND_LOG_FILE}" 2>&1 &
    local backend_pid=$!
    printf '%s\n' "${backend_pid}" > "${BACKEND_PID_FILE}"

    "${WEBUI_CLI_SCRIPT}" serve --host "${API_HOST}" --port "${WEBUI_PORT}" >"${WEBUI_LOG_FILE}" 2>&1 &
    local webui_pid=$!
    printf '%s\n' "${webui_pid}" > "${WEBUI_PID_FILE}"

    printf 'Started local stack in background.\n'
    printf '  Backend PID: %s\n' "${backend_pid}"
    printf '  WebUI PID: %s\n' "${webui_pid}"
    printf '  Backend log: %s\n' "${BACKEND_LOG_FILE}"
    printf '  WebUI log: %s\n' "${WEBUI_LOG_FILE}"
    printf 'Use pypnm-cmts-webui kill-pypnm-webui --list/--kill/--kill-all to stop WebUI processes.\n'
    exit 0
  fi

  "${backend_cli}" "${backend_args[@]}" &
  local backend_pid=$!

  cleanup() {
    if kill -0 "${backend_pid}" >/dev/null 2>&1; then
      kill "${backend_pid}" >/dev/null 2>&1 || true
      wait "${backend_pid}" 2>/dev/null || true
    fi
  }

  trap cleanup EXIT INT TERM

  exec "${WEBUI_CLI_SCRIPT}" serve --host "${API_HOST}" --port "${WEBUI_PORT}"
}

main "$@"
