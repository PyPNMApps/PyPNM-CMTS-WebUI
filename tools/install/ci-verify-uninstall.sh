#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PYPNM_PATH=""
PRODUCT_PROFILE="pypnm-cmts-webui"
BACKEND_FLAG="--with-pypnm-docsis-cmts"
LOG_PREFIX="verify-uninstall"

log() {
  printf '[ci][%s] %s\n' "${LOG_PREFIX}" "$1"
}

fail() {
  printf '[ci][%s][error] %s\n' "${LOG_PREFIX}" "$1" >&2
  exit 1
}

print_help() {
  cat <<'EOF'
Usage:
  ./tools/install/ci-verify-uninstall.sh --pypnm-path <path> [options]

Options:
  --pypnm-path <path>   Local backend checkout path for editable install.
  --profile <name>      Product profile: pypnm-webui or pypnm-cmts-webui.
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
      --profile)
        shift
        PRODUCT_PROFILE="${1:-}"
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

assert_path_absent() {
  local target="$1"
  local label="$2"
  if [ -e "${target}" ]; then
    fail "Expected ${label} to be removed, but found: ${target}"
  fi
}

assert_file_absent() {
  local target="$1"
  local label="$2"
  if [ -f "${target}" ]; then
    fail "Expected ${label} to be removed, but found: ${target}"
  fi
}

verify_clean_state() {
  log "Verifying uninstall clean state"
  assert_path_absent "${ROOT_DIR}/node_modules" "npm dependencies"
  assert_path_absent "${ROOT_DIR}/.venv" "Python virtual environment"
  assert_path_absent "${ROOT_DIR}/.pypnm-venv" "legacy virtual environment"
  assert_path_absent "${ROOT_DIR}/dist" "build output"
  assert_path_absent "${ROOT_DIR}/release-reports" "release reports"
  assert_path_absent "${ROOT_DIR}/logs" "runtime logs"
  assert_file_absent "${ROOT_DIR}/public/config/pypnm-instances.local.yaml" "local runtime override"
  assert_file_absent "${ROOT_DIR}/.env" "environment file"
  assert_file_absent "${HOME}/.local/bin/pypnm-cmts-webui" "CMTS CLI shim"
  assert_file_absent "${HOME}/.local/bin/pypnm-webui" "PW CLI shim"
  assert_file_absent "${HOME}/.local/bin/pypnm-docsis-cmts" "CMTS backend shim"
  assert_file_absent "${HOME}/.local/bin/pypnm-docsis" "PW backend shim"
  assert_file_absent "${HOME}/.local/bin/pypnm-cmts-webui-local-stack" "CMTS stack shim"
  assert_file_absent "${HOME}/.local/bin/pypnm-webui-local-stack" "PW stack shim"

  if command -v npm >/dev/null 2>&1; then
    if npm ls -g --depth=0 pypnm-cmts-webui >/dev/null 2>&1; then
      fail "Expected global npm link pypnm-cmts-webui to be removed."
    fi
  fi
}

main() {
  parse_args "$@"

  [ -n "${PYPNM_PATH}" ] || fail "--pypnm-path is required."
  [ -f "${PYPNM_PATH}/pyproject.toml" ] || fail "Invalid backend path: ${PYPNM_PATH}"

  case "${PRODUCT_PROFILE}" in
    pypnm-webui)
      BACKEND_FLAG="--with-pypnm-docsis"
      LOG_PREFIX="verify-uninstall-pw"
      ;;
    pypnm-cmts-webui)
      BACKEND_FLAG="--with-pypnm-docsis-cmts"
      LOG_PREFIX="verify-uninstall-pcw"
      ;;
    *)
      fail "Unsupported --profile value: ${PRODUCT_PROFILE}"
      ;;
  esac

  local detected_python_bin=""
  if command -v python >/dev/null 2>&1; then
    detected_python_bin="python"
  elif command -v python3 >/dev/null 2>&1; then
    detected_python_bin="python3"
  else
    fail "Python executable not found (expected python or python3)."
  fi

  cd "${ROOT_DIR}"
  rm -rf .venv .pypnm-venv node_modules public/config/pypnm-instances.local.yaml .env
  rm -f "${HOME}/.local/bin/pypnm-cmts-webui" \
        "${HOME}/.local/bin/pypnm-webui" \
        "${HOME}/.local/bin/pypnm-docsis-cmts" \
        "${HOME}/.local/bin/pypnm-docsis" \
        "${HOME}/.local/bin/pypnm-cmts-webui-local-stack" \
        "${HOME}/.local/bin/pypnm-webui-local-stack"

  log "Running install before uninstall verification"
  PYTHON_BIN="${detected_python_bin}" ./install.sh \
    --with-"${PRODUCT_PROFILE}" \
    "${BACKEND_FLAG}" \
    --pypnm-docsis-path "${PYPNM_PATH}" \
    --local-api-host 127.0.0.1

  log "Running uninstall"
  ./uninstall.sh --confirm-uninstall --remove-env

  verify_clean_state
  log "Uninstall clean-state verification passed"
}

main "$@"
