#!/usr/bin/env bash
set -euo pipefail

LOG_PREFIX="host-prereqs"

log() {
  printf '[ci][%s] %s\n' "${LOG_PREFIX}" "$1"
}

fail() {
  printf '[ci][%s][error] %s\n' "${LOG_PREFIX}" "$1" >&2
  exit 1
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

required_cmds=(
  bash
  awk
  sed
  grep
  ps
  kill
  node
  npm
  python3
  git
)

log "Verifying required host tools are available"
for cmd in "${required_cmds[@]}"; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    fail "Missing required command: ${cmd}"
  fi
done

log "Host tool versions"
printf '[ci][%s] bash: %s\n' "${LOG_PREFIX}" "$(bash --version | head -n1)"
printf '[ci][%s] awk: %s\n' "${LOG_PREFIX}" "$(awk -W version 2>&1 | head -n1 || awk --version 2>&1 | head -n1 || echo "version unavailable")"
printf '[ci][%s] node: %s\n' "${LOG_PREFIX}" "$(node --version)"
printf '[ci][%s] npm: %s\n' "${LOG_PREFIX}" "$(npm --version)"
printf '[ci][%s] python3: %s\n' "${LOG_PREFIX}" "$(python3 --version 2>&1)"
printf '[ci][%s] git: %s\n' "${LOG_PREFIX}" "$(git --version)"

log "Running shell script syntax checks"
bash -n tools/maintenance/kill-pypnm-webui.sh
bash -n tools/install/start-local-stack.sh
bash -n tools/install/uninstall.sh

log "Running kill script smoke tests"
./tools/maintenance/kill-pypnm-webui.sh --help >/dev/null
./tools/maintenance/kill-pypnm-webui.sh --list >/dev/null

log "Host prereq verification passed"
