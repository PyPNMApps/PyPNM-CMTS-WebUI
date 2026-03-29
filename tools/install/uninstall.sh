#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=""
ASSUME_YES=0
REMOVE_ENV=0
REMOVE_DATA=0

log() {
  printf '[uninstall] %s\n' "$1"
}

fail() {
  printf '[uninstall][error] %s\n' "$1" >&2
  exit 1
}

print_help() {
  cat <<'EOF'
Usage:
  ./tools/install/uninstall.sh --root-dir <repo-root> [options]

Options:
  --root-dir <path>   PyPNM-CMTS-WebUI repo root (required).
  --confirm-uninstall Run without interactive confirmation prompt.
  --remove-env        Remove .env in addition to runtime/local artifacts.
  --remove-data       Remove .data capture directory.
  -h, --help          Show this help.
EOF
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --root-dir)
        shift
        ROOT_DIR="${1:-}"
        ;;
      --confirm-uninstall)
        ASSUME_YES=1
        ;;
      --remove-env)
        REMOVE_ENV=1
        ;;
      --remove-data)
        REMOVE_DATA=1
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

remove_path_if_present() {
  local target="$1"
  local label="$2"
  if [ -e "${target}" ]; then
    rm -rf "${target}"
    log "Removed ${label}: ${target}"
  else
    log "Skipped ${label}; not found: ${target}"
  fi
}

remove_file_if_present() {
  local target="$1"
  local label="$2"
  if [ -f "${target}" ]; then
    rm -f "${target}"
    log "Removed ${label}: ${target}"
  else
    log "Skipped ${label}; not found: ${target}"
  fi
}

confirm_uninstall() {
  if [ "${ASSUME_YES}" -eq 1 ]; then
    return
  fi
  if [ ! -t 0 ]; then
    fail "Refusing non-interactive uninstall without --confirm-uninstall."
  fi

  printf '\n' >&2
  printf 'This will remove local install artifacts for this repo:\n' >&2
  printf '  - node_modules\n' >&2
  printf '  - .venv and .pypnm-venv\n' >&2
  printf '  - dist, release-reports, logs\n' >&2
  printf '  - public/config/pypnm-instances.local.yaml and backups\n' >&2
  printf '  - ~/.local/bin shims for pypnm-cmts-webui / pypnm-docsis-cmts / pypnm-cmts-webui-local-stack\n' >&2
  if [ "${REMOVE_ENV}" -eq 1 ]; then
    printf '  - .env\n' >&2
  fi
  if [ "${REMOVE_DATA}" -eq 1 ]; then
    printf '  - .data\n' >&2
  fi
  printf '\n' >&2

  local answer=""
  read -r -p "Continue uninstall? [y/N]: " answer || true
  case "${answer}" in
    y|Y|yes|YES)
      ;;
    *)
      fail "Uninstall cancelled."
      ;;
  esac
}

main() {
  parse_args "$@"
  [ -n "${ROOT_DIR}" ] || fail "--root-dir is required."
  cd "${ROOT_DIR}"

  confirm_uninstall

  remove_path_if_present "${ROOT_DIR}/node_modules" "npm dependencies"
  remove_path_if_present "${ROOT_DIR}/.venv" "Python virtual environment"
  remove_path_if_present "${ROOT_DIR}/.pypnm-venv" "legacy backend virtual environment"
  remove_path_if_present "${ROOT_DIR}/dist" "build output"
  remove_path_if_present "${ROOT_DIR}/release-reports" "release reports"
  remove_path_if_present "${ROOT_DIR}/logs" "runtime logs"
  remove_file_if_present "${ROOT_DIR}/public/config/pypnm-instances.local.yaml" "local runtime config"

  if [ -d "${ROOT_DIR}/public/config" ]; then
    find "${ROOT_DIR}/public/config" -maxdepth 1 -type f -name 'pypnm-instances.local.yaml.*.bak' -exec rm -f {} +
    log "Removed local runtime config backups from public/config/"
  fi

  if [ "${REMOVE_ENV}" -eq 1 ]; then
    remove_file_if_present "${ROOT_DIR}/.env" "environment file"
  fi

  if [ "${REMOVE_DATA}" -eq 1 ]; then
    remove_path_if_present "${ROOT_DIR}/.data" "capture data"
  fi

  remove_file_if_present "${HOME}/.local/bin/pypnm-cmts-webui" "CLI shim"
  remove_file_if_present "${HOME}/.local/bin/pypnm-docsis-cmts" "backend CLI shim"
  remove_file_if_present "${HOME}/.local/bin/pypnm-cmts-webui-local-stack" "local stack helper shim"
  remove_file_if_present "${HOME}/.local/bin/pypnm-webui" "legacy CLI compatibility shim"
  remove_file_if_present "${HOME}/.local/bin/pypnm-docsis" "legacy backend compatibility shim"
  remove_file_if_present "${HOME}/.local/bin/pypnm-webui-local-stack" "legacy local stack compatibility shim"

  log "Uninstall complete"
  log "Reinstall with: ./install.sh"
}

main "$@"
