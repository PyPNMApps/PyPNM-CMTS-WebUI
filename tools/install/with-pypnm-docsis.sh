#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=""
PYTHON_BIN="python3"
PYPNM_DOCSIS_PATH=""
PYPNM_DOCSIS_VERSION=""
PYPNM_DOCSIS_PIP_PACKAGE="pypnm-docsis-cmts"
LOCAL_API_HOST=""
LOCAL_API_PORT=""
RECONFIGURE_LOCAL_AGENT=0
BACKEND_VENV_PATH=".venv"
RUNTIME_TEMPLATE_PATH="public/config/pypnm-instances.yaml"
RUNTIME_LOCAL_PATH="public/config/pypnm-instances.local.yaml"
PYPNM_DEFAULT_PORT="8000"

log() {
  printf '[install][pypnm-docsis] %s\n' "$1"
}

fail() {
  printf '[install][pypnm-docsis][error] %s\n' "$1" >&2
  exit 1
}

prompt_existing_state_choice() {
  local has_existing_venv="0"
  local has_existing_local_config="0"
  local existing_host=""
  local existing_port="${PYPNM_DEFAULT_PORT}"

  [ -d "${ROOT_DIR}/${BACKEND_VENV_PATH}" ] && has_existing_venv="1"
  [ -f "${ROOT_DIR}/${RUNTIME_LOCAL_PATH}" ] && has_existing_local_config="1"

  if [ "${has_existing_venv}" = "0" ] && [ "${has_existing_local_config}" = "0" ]; then
    return
  fi

  if [ -n "${LOCAL_API_HOST}" ] || [ -n "${LOCAL_API_PORT}" ] || [ "${RECONFIGURE_LOCAL_AGENT}" -eq 1 ]; then
    return
  fi

  if [ ! -t 0 ]; then
    return
  fi

  existing_host="$(read_existing_local_host || true)"
  existing_port="$(read_existing_local_port || true)"
  if [ -z "${existing_port}" ]; then
    existing_port="${PYPNM_DEFAULT_PORT}"
  fi

  printf '\n' >&2
  log "Detected previous local combined-install state:" >&2
  if [ "${has_existing_venv}" = "1" ]; then
    printf '  - existing backend environment: %s\n' "${BACKEND_VENV_PATH}" >&2
  fi
  if [ "${has_existing_local_config}" = "1" ]; then
    if [ -n "${existing_host}" ]; then
      printf '  - existing Local PyPNM-CMTS Agent endpoint: %s:%s\n' "${existing_host}" "${existing_port}" >&2
    else
      printf '  - existing local runtime config file: %s\n' "${RUNTIME_LOCAL_PATH}" >&2
    fi
  fi
  printf '\n' >&2
  printf '  1) Continue with existing install/configuration\n' >&2
  printf '  2) Continue and reconfigure Local PyPNM-CMTS Agent host\n' >&2
  printf '  3) Cancel install\n' >&2
  printf '\n' >&2

  local selection="1"
  read -r -p "Selection [1]: " selection || true
  selection="$(trim_value "${selection:-1}")"
  selection="${selection:-1}"

  case "${selection}" in
    1)
      ;;
    2)
      RECONFIGURE_LOCAL_AGENT=1
      ;;
    3)
      fail "Install cancelled by user."
      ;;
    *)
      fail "Invalid selection: ${selection}"
      ;;
  esac
}

trim_value() {
  local value="${1:-}"
  printf '%s' "${value}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

validate_local_host() {
  local host
  host="$(trim_value "${1:-}")"
  if [ -z "${host}" ]; then
    fail "Resolved local API host is empty."
  fi
  if [[ "${host}" == *$'\n'* || "${host}" == *$'\r'* || "${host}" == *" "* ]]; then
    fail "Resolved local API host contains invalid whitespace: ${host}"
  fi
  if ! [[ "${host}" =~ ^([0-9]{1,3}(\.[0-9]{1,3}){3}|localhost|[A-Za-z0-9.-]+)$ ]]; then
    fail "Resolved local API host is invalid: ${host}"
  fi
  printf '%s' "${host}"
}

print_help() {
  cat <<'EOF'
Usage:
  ./tools/install/with-pypnm-docsis.sh --root-dir <repo-root> [options]

Options:
  --root-dir <path>              PyPNM-WebUI repo root (required).
  --python-bin <python>          Python executable to use (default: python3).
  --pypnm-docsis-path <path>     Install backend from a local PyPNM checkout.
  --pypnm-docsis-version <ver>   Install a specific pypnm-docsis-cmts version from pip.
  --local-api-host <host>        Preselect the local API host without prompting.
  --local-api-port <port>        Set the local API port in runtime config.
  --reconfigure-local-agent      Ignore any previously configured local API host.
  -h, --help                     Show this help.
EOF
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --root-dir)
        shift
        ROOT_DIR="${1:-}"
        ;;
      --python-bin)
        shift
        PYTHON_BIN="${1:-}"
        ;;
      --pypnm-docsis-path)
        shift
        PYPNM_DOCSIS_PATH="${1:-}"
        ;;
      --pypnm-docsis-version)
        shift
        PYPNM_DOCSIS_VERSION="${1:-}"
        ;;
      --local-api-host)
        shift
        LOCAL_API_HOST="${1:-}"
        ;;
      --local-api-port)
        shift
        LOCAL_API_PORT="${1:-}"
        ;;
      --reconfigure-local-agent)
        RECONFIGURE_LOCAL_AGENT=1
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

run_backend_python() {
  env -u PYTHONPATH -u PYTHONHOME "${ROOT_DIR}/${BACKEND_VENV_PATH}/bin/python" -I "$@"
}

ensure_python_venv_prereqs() {
  if ! "${PYTHON_BIN}" -m venv --help >/dev/null 2>&1; then
    fail "Python venv support is required but unavailable for ${PYTHON_BIN}. Install Python venv support and re-run."
  fi

  local pyver
  pyver="$(env -u PYTHONPATH -u PYTHONHOME "${PYTHON_BIN}" -I - <<'EOF'
import sys
print(f"{sys.version_info.major}.{sys.version_info.minor}")
EOF
)"
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  local venv_stderr
  venv_stderr="${tmp_dir}/venv.stderr"
  if env -u PYTHONPATH -u PYTHONHOME "${PYTHON_BIN}" -I -m venv "${tmp_dir}/check" 2>"${venv_stderr}"; then
    rm -rf "${tmp_dir}"
    return
  fi

  local first_error_line=""
  if [ -s "${venv_stderr}" ]; then
    first_error_line="$(head -n1 "${venv_stderr}" | tr -d '\r')"
  fi
  rm -rf "${tmp_dir}"

  fail "Python venv creation failed for ${PYTHON_BIN} (${pyver}). Install Python venv tooling (Ubuntu: sudo apt-get install -y python${pyver}-venv python3-venv python3-pip) and re-run.${first_error_line:+ Error: ${first_error_line}}"
}

ensure_backend_venv() {
  if [ ! -d "${ROOT_DIR}/${BACKEND_VENV_PATH}" ]; then
    log "Creating backend virtual environment (${BACKEND_VENV_PATH})"
    env -u PYTHONPATH -u PYTHONHOME "${PYTHON_BIN}" -I -m venv "${ROOT_DIR}/${BACKEND_VENV_PATH}"
  else
    log "Keeping existing backend virtual environment (${BACKEND_VENV_PATH})"
  fi

  log "Upgrading backend pip tooling"
  run_backend_python -m pip install --upgrade pip setuptools wheel >/dev/null
}

install_pypnm_docsis() {
  if [ -n "${PYPNM_DOCSIS_PATH}" ]; then
    if [ ! -f "${PYPNM_DOCSIS_PATH}/pyproject.toml" ]; then
      fail "Local backend path does not contain pyproject.toml: ${PYPNM_DOCSIS_PATH}"
    fi
    log "Installing backend from local checkout: ${PYPNM_DOCSIS_PATH}"
    run_backend_python -m pip install -e "${PYPNM_DOCSIS_PATH}"
  elif [ -n "${PYPNM_DOCSIS_VERSION}" ]; then
    log "Installing ${PYPNM_DOCSIS_PIP_PACKAGE}==${PYPNM_DOCSIS_VERSION} from pip"
    run_backend_python -m pip install "${PYPNM_DOCSIS_PIP_PACKAGE}==${PYPNM_DOCSIS_VERSION}"
  else
    log "Installing ${PYPNM_DOCSIS_PIP_PACKAGE} from pip"
    run_backend_python -m pip install "${PYPNM_DOCSIS_PIP_PACKAGE}"
  fi

  if ! "${ROOT_DIR}/${BACKEND_VENV_PATH}/bin/pypnm" --version >/dev/null 2>&1; then
    fail "Installed backend does not expose the pypnm CLI."
  fi
}

detect_ipv4_candidates() {
  if command -v ip >/dev/null 2>&1; then
    ip -o -4 addr show up scope global | awk '{print $2, $4}'
    return
  fi

  if command -v hostname >/dev/null 2>&1; then
    hostname -I 2>/dev/null | tr ' ' '\n' | awk 'NF {print "host", $1}'
    return
  fi
}

read_existing_local_host() {
  local existing_path=""
  if [ "${RECONFIGURE_LOCAL_AGENT}" -eq 0 ] && [ -f "${ROOT_DIR}/${RUNTIME_LOCAL_PATH}" ]; then
    existing_path="${ROOT_DIR}/${RUNTIME_LOCAL_PATH}"
  fi

  CONFIG_PATH="${existing_path}" node --input-type=module <<EOF
import fs from "node:fs";
import { parse } from "yaml";
import { readConfiguredLocalPyPnmHost } from "${ROOT_DIR}/tools/install/local_pypnm_docsis.js";

const configPath = process.env.CONFIG_PATH ?? "";
if (!configPath || !fs.existsSync(configPath)) {
  process.stdout.write("");
  process.exit(0);
}

const raw = fs.readFileSync(configPath, "utf8");
const config = parse(raw) ?? {};
process.stdout.write(readConfiguredLocalPyPnmHost(config));
EOF
}

read_existing_local_port() {
  local existing_path=""
  if [ "${RECONFIGURE_LOCAL_AGENT}" -eq 0 ] && [ -f "${ROOT_DIR}/${RUNTIME_LOCAL_PATH}" ]; then
    existing_path="${ROOT_DIR}/${RUNTIME_LOCAL_PATH}"
  fi

  CONFIG_PATH="${existing_path}" node --input-type=module <<EOF
import fs from "node:fs";
import { parse } from "yaml";
import { readConfiguredLocalPyPnmPort } from "${ROOT_DIR}/tools/install/local_pypnm_docsis.js";

const configPath = process.env.CONFIG_PATH ?? "";
if (!configPath || !fs.existsSync(configPath)) {
  process.stdout.write("");
  process.exit(0);
}

const raw = fs.readFileSync(configPath, "utf8");
const config = parse(raw) ?? {};
process.stdout.write(String(readConfiguredLocalPyPnmPort(config)));
EOF
}

validate_local_port() {
  local port="${1:-}"
  if ! [[ "${port}" =~ ^[0-9]+$ ]]; then
    fail "Local API port must be numeric: ${port}"
  fi
  if [ "${port}" -lt 1 ] || [ "${port}" -gt 65535 ]; then
    fail "Local API port out of range (1-65535): ${port}"
  fi
  printf '%s' "${port}"
}

resolve_local_api_port() {
  local explicit_port
  explicit_port="$(trim_value "${LOCAL_API_PORT}")"
  if [ -n "${explicit_port}" ]; then
    validate_local_port "${explicit_port}"
    return
  fi

  local existing_port
  existing_port="$(trim_value "$(read_existing_local_port || true)")"
  local default_port="${existing_port:-${PYPNM_DEFAULT_PORT}}"

  if [ ! -t 0 ]; then
    printf '%s' "${default_port}"
    return
  fi

  printf '\n' >&2
  log "Select the local PyPNM API port for WebUI runtime config:" >&2
  printf '\n' >&2
  printf '  Press Enter to use default %s\n' "${default_port}" >&2
  printf '\n' >&2

  local selection=""
  read -r -p "Port [${default_port}]: " selection || true
  selection="$(trim_value "${selection}")"
  if [ -z "${selection}" ]; then
    selection="${default_port}"
  fi

  validate_local_port "${selection}"
}

resolve_local_api_host() {
  local explicit_host="${LOCAL_API_HOST}"
  local existing_host
  existing_host="$(read_existing_local_host)"
  local interactive="true"
  if [ ! -t 0 ]; then
    interactive="false"
  fi

  local detection_output
  detection_output="$(detect_ipv4_candidates || true)"

  local decision_json
  decision_json="$(EXPLICIT_HOST="${explicit_host}" EXISTING_HOST="${existing_host}" RAW_CANDIDATES="${detection_output}" IS_INTERACTIVE="${interactive}" node --input-type=module <<EOF
import { choosePreferredLocalHost, parseIpv4Candidates } from "${ROOT_DIR}/tools/install/local_pypnm_docsis.js";

const explicitHost = process.env.EXPLICIT_HOST ?? "";
const existingHost = process.env.EXISTING_HOST ?? "";
const rawCandidates = process.env.RAW_CANDIDATES ?? "";
const isInteractive = (process.env.IS_INTERACTIVE ?? "false") === "true";

process.stdout.write(JSON.stringify(
  choosePreferredLocalHost({
    explicitHost,
    existingHost,
    candidates: parseIpv4Candidates(rawCandidates),
    isInteractive,
  }),
));
EOF
)"

  local needs_prompt
  needs_prompt="$(DECISION_JSON="${decision_json}" node --input-type=module <<EOF
const decision = JSON.parse(process.env.DECISION_JSON ?? "{}");
process.stdout.write(decision.needsPrompt ? "1" : "0");
EOF
)"

  if [ "${needs_prompt}" != "1" ]; then
    local resolved_host
    resolved_host="$(DECISION_JSON="${decision_json}" node --input-type=module <<EOF
const decision = JSON.parse(process.env.DECISION_JSON ?? "{}");
process.stdout.write(decision.host);
EOF
)"
    validate_local_host "${resolved_host}"
    return
  fi

  local choice_lines
  choice_lines="$(DECISION_JSON="${decision_json}" node --input-type=module <<EOF
const decision = JSON.parse(process.env.DECISION_JSON ?? "{}");
for (let index = 0; index < decision.choices.length; index += 1) {
  const choice = decision.choices[index];
  process.stdout.write(String(index + 1) + "|" + choice.host + "|" + choice.label + "|" + choice.detail + "\\n");
}
EOF
)"

  printf '\n' >&2
  log "Select the local PyPNM API host for WebUI runtime config:" >&2
  printf '\n' >&2
  while IFS='|' read -r index host label detail; do
    [ -n "${index}" ] || continue
    printf '  %s) %s - %s\n' "${index}" "${label}" "${detail}" >&2
  done <<EOF
${choice_lines}
EOF

  local default_selection="1"
  local selection=""
  printf '\n' >&2
  read -r -p "Selection [${default_selection}]: " selection || true
  selection="${selection:-${default_selection}}"
  selection="$(trim_value "${selection}")"

  local selected_host=""
  while IFS='|' read -r index host label detail; do
    if [ "${index}" = "${selection}" ]; then
      selected_host="${host}"
      break
    fi
  done <<EOF
${choice_lines}
EOF

  selected_host="$(validate_local_host "${selected_host}")"
  if [ -z "${selected_host}" ]; then
    fail "Invalid local API host selection: ${selection}"
  fi

  printf '%s' "${selected_host}"
}

write_local_runtime_config() {
  local selected_host="$1"
  local selected_port="$2"

  log "Updating local runtime config for Local PyPNM-CMTS Agent (${selected_host}:${selected_port})"
  SELECTED_HOST="${selected_host}" SELECTED_PORT="${selected_port}" node --input-type=module <<EOF
import fs from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import { applyLocalPyPnmAgentConfig } from "${ROOT_DIR}/tools/install/local_pypnm_docsis.js";

const templatePath = "${ROOT_DIR}/${RUNTIME_TEMPLATE_PATH}";
const outputPath = "${ROOT_DIR}/${RUNTIME_LOCAL_PATH}";
const localPath = fs.existsSync(outputPath) ? outputPath : "";
const templateConfig = parse(fs.readFileSync(templatePath, "utf8")) ?? {};
const localConfig = localPath ? (parse(fs.readFileSync(localPath, "utf8")) ?? {}) : {};
const selectedPort = Number.parseInt(process.env.SELECTED_PORT ?? "", 10);
const merged = applyLocalPyPnmAgentConfig(templateConfig, localConfig, process.env.SELECTED_HOST ?? "", selectedPort);
const nextContent = stringify(merged, { indent: 2 });

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
if (fs.existsSync(outputPath)) {
  const existingContent = fs.readFileSync(outputPath, "utf8");
  if (existingContent !== nextContent) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(outputPath, outputPath + "." + timestamp + ".bak");
  }
}
fs.writeFileSync(outputPath, nextContent, "utf8");
EOF
}

install_local_stack_shim() {
  local user_bin_dir="${HOME}/.local/bin"
  local shim_path="${user_bin_dir}/pypnm-webui-local-stack"

  mkdir -p "${user_bin_dir}"
  printf '%s\n' "#!/usr/bin/env bash" >"${shim_path}"
  printf '%s\n' "exec \"${ROOT_DIR}/tools/install/start-local-stack.sh\" \"\$@\"" >>"${shim_path}"
  chmod +x "${shim_path}"
  log "Installed local-stack helper at ${shim_path}"
}

install_backend_cli_shim() {
  local user_bin_dir="${HOME}/.local/bin"
  local shim_path="${user_bin_dir}/pypnm-docsis"
  local backend_cli="${ROOT_DIR}/${BACKEND_VENV_PATH}/bin/pypnm"

  [ -x "${backend_cli}" ] || fail "Backend CLI missing after install: ${backend_cli}"

  mkdir -p "${user_bin_dir}"
  printf '%s\n' "#!/usr/bin/env bash" >"${shim_path}"
  printf '%s\n' "exec \"${backend_cli}\" \"\$@\"" >>"${shim_path}"
  chmod +x "${shim_path}"
  log "Installed backend CLI shim at ${shim_path}"
}

main() {
  parse_args "$@"

  [ -n "${ROOT_DIR}" ] || fail "--root-dir is required."
  cd "${ROOT_DIR}"
  prompt_existing_state_choice
  ensure_python_venv_prereqs

  ensure_backend_venv
  install_pypnm_docsis

  local selected_host
  local selected_port
  selected_host="$(resolve_local_api_host)"
  selected_port="$(resolve_local_api_port)"
  write_local_runtime_config "${selected_host}" "${selected_port}"
  install_backend_cli_shim
  install_local_stack_shim

  log "Combined local install complete"
  log "Local PyPNM API URL: http://${selected_host}:${selected_port}"
  log "Run backend directly with: pypnm-docsis serve --host ${selected_host} --port ${selected_port}"
  log "Start both services with: pypnm-webui start-local-stack"
}

main "$@"
