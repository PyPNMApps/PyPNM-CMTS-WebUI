#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELPER_PATH="${ROOT_DIR}/tools/install/uninstall.sh"

print_help() {
  cat <<'EOF'
Usage:
  ./uninstall.sh [options]

Options:
  --confirm-uninstall Run without interactive confirmation prompt.
  --remove-env        Remove .env in addition to runtime/local artifacts.
  --remove-data       Remove .data capture directory.
  -h, --help          Show this help.
EOF
}

if [ ! -x "${HELPER_PATH}" ]; then
  printf '[uninstall][error] Missing or non-executable helper: %s\n' "${HELPER_PATH}" >&2
  exit 1
fi

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  print_help
  exit 0
fi

exec "${HELPER_PATH}" --root-dir "${ROOT_DIR}" "$@"
