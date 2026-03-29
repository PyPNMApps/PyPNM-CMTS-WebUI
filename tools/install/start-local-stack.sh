#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_HOST="0.0.0.0"
API_PORT="8000"
WEBUI_PORT="4175"
API_RELOAD=0

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

main() {
  parse_args "$@"

  local backend_cli="${ROOT_DIR}/.venv/bin/pypnm"
  if [ ! -x "${backend_cli}" ] && [ -x "${ROOT_DIR}/.pypnm-venv/bin/pypnm" ]; then
    # Backward-compatible fallback for older combined installs.
    backend_cli="${ROOT_DIR}/.pypnm-venv/bin/pypnm"
  fi
  if [ ! -x "${backend_cli}" ]; then
    printf 'ERROR: backend CLI not found in .venv (legacy fallback: .pypnm-venv). Run ./install.sh --with-pypnm-docsis-cmts first.\n' >&2
    exit 1
  fi

  local backend_args=("serve" "--host" "${API_HOST}" "--port" "${API_PORT}")
  if [ "${API_RELOAD}" -eq 1 ]; then
    backend_args+=("--reload")
  fi

  cd "${ROOT_DIR}"
  "${backend_cli}" "${backend_args[@]}" &
  local backend_pid=$!

  cleanup() {
    if kill -0 "${backend_pid}" >/dev/null 2>&1; then
      kill "${backend_pid}" >/dev/null 2>&1 || true
      wait "${backend_pid}" 2>/dev/null || true
    fi
  }

  trap cleanup EXIT INT TERM

  exec "${ROOT_DIR}/tools/cli/pypnm-cmts-webui.js" serve --host "${API_HOST}" --port "${WEBUI_PORT}"
}

main "$@"
