#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  kill-pypnm-webui.sh --list
  kill-pypnm-webui.sh --kill [INDEX_OR_PID]
  kill-pypnm-webui.sh --kill-all

Options:
  --list              List active PyPNM-WebUI processes for this repo.
  --kill [ARG]        Kill one process. If ARG is omitted, show numbered
                      entries and prompt for a selection. ARG may be either a
                      list index or an exact PID.
  --kill-all          Kill all active PyPNM-WebUI processes for this repo.
  -h, --help          Show this help.
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

is_integer() {
  [[ "${1:-}" =~ ^[0-9]+$ ]]
}

get_webui_processes() {
  ps -eo pid=,args= | awk -v repo_root="${REPO_ROOT}" -v self_pid="$$" '
    {
      pid = $1
      $1 = ""
      sub(/^[[:space:]]+/, "", $0)
      cmd = $0

      if (pid == self_pid) next
      if (cmd ~ /kill-pypnm-webui\.sh/) next
      if (cmd ~ /^awk[[:space:]]/) next
      if (cmd ~ /^ps[[:space:]]/) next

      has_webui = (
        cmd ~ /pypnm-webui/ ||
        cmd ~ /pypnm-cmts-webui/ ||
        cmd ~ /pypnm_cmts_webui_cli\.js/ ||
        cmd ~ /vite(\.js)?/ ||
        cmd ~ /npm run serve/ ||
        cmd ~ /npm run dev/
      )
      has_repo = (index(cmd, repo_root) > 0)

      if (has_webui && has_repo) {
        print pid "\t" cmd
      }
    }
  '
}

list_processes() {
  local rows
  rows="$(get_webui_processes || true)"
  if [[ -z "${rows}" ]]; then
    echo "No active PyPNM-WebUI processes found for ${REPO_ROOT}."
    return 0
  fi

  printf "%-6s %-8s %s\n" "INDEX" "PID" "COMMAND"
  local index=1
  while IFS=$'\t' read -r pid cmd; do
    [[ -z "${pid:-}" ]] && continue
    printf "%-6s %-8s %s\n" "${index}" "${pid}" "${cmd}"
    index=$((index + 1))
  done <<< "${rows}"
}

resolve_target_pid() {
  local selection="$1"
  local rows
  rows="$(get_webui_processes || true)"
  [[ -n "${rows}" ]] || return 1

  if ! is_integer "${selection}"; then
    return 1
  fi

  local pid_match
  pid_match="$(echo "${rows}" | awk -F '\t' -v pid="${selection}" '$1 == pid { print $1; exit }')"
  if [[ -n "${pid_match}" ]]; then
    printf "%s\n" "${pid_match}"
    return 0
  fi

  local index=1
  while IFS=$'\t' read -r pid _cmd; do
    [[ -z "${pid:-}" ]] && continue
    if [[ "${index}" -eq "${selection}" ]]; then
      printf "%s\n" "${pid}"
      return 0
    fi
    index=$((index + 1))
  done <<< "${rows}"

  return 1
}

kill_one() {
  local pid="$1"

  if ! is_integer "${pid}"; then
    echo "Invalid PID: ${pid}" >&2
    exit 2
  fi

  if ! kill -0 "${pid}" 2>/dev/null; then
    echo "PID ${pid} is not running."
    exit 1
  fi

  local verified_pid
  verified_pid="$(resolve_target_pid "${pid}" || true)"
  if [[ "${verified_pid}" != "${pid}" ]]; then
    echo "PID ${pid} is not an active PyPNM-WebUI process for ${REPO_ROOT}." >&2
    exit 1
  fi

  kill "${pid}"
  echo "Sent SIGTERM to PyPNM-WebUI process PID ${pid}."
}

prompt_and_kill() {
  local rows
  rows="$(get_webui_processes || true)"
  if [[ -z "${rows}" ]]; then
    echo "No active PyPNM-WebUI processes found for ${REPO_ROOT}."
    return 0
  fi

  list_processes
  printf "Select process number to kill: "
  local answer
  IFS= read -r answer
  answer="${answer//[[:space:]]/}"

  if [[ -z "${answer}" ]]; then
    echo "No selection provided."
    exit 2
  fi

  local pid
  pid="$(resolve_target_pid "${answer}" || true)"
  if [[ -z "${pid}" ]]; then
    echo "Invalid selection: ${answer}" >&2
    exit 2
  fi

  kill_one "${pid}"
}

kill_all() {
  local rows
  rows="$(get_webui_processes || true)"
  if [[ -z "${rows}" ]]; then
    echo "No active PyPNM-WebUI processes found for ${REPO_ROOT}."
    return 0
  fi

  local count=0
  while IFS=$'\t' read -r pid _cmd; do
    [[ -z "${pid:-}" ]] && continue
    kill "${pid}"
    count=$((count + 1))
    echo "Sent SIGTERM to PID ${pid}."
  done <<< "${rows}"

  echo "Sent SIGTERM to ${count} PyPNM-WebUI process(es)."
}

main() {
  if [[ $# -eq 0 ]]; then
    usage
    exit 2
  fi

  case "${1:-}" in
    --list)
      [[ $# -eq 1 ]] || { usage; exit 2; }
      list_processes
      ;;
    --kill)
      if [[ $# -eq 1 ]]; then
        prompt_and_kill
      elif [[ $# -eq 2 ]]; then
        local pid
        pid="$(resolve_target_pid "$2" || true)"
        if [[ -z "${pid}" ]]; then
          echo "Invalid selection or PID: $2" >&2
          exit 2
        fi
        kill_one "${pid}"
      else
        usage
        exit 2
      fi
      ;;
    --kill-all)
      [[ $# -eq 1 ]] || { usage; exit 2; }
      kill_all
      ;;
    -h|--help)
      usage
      ;;
    *)
      usage
      exit 2
      ;;
  esac
}

main "$@"
