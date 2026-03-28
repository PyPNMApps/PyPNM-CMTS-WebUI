#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NVM_VERSION="v0.40.3"
NODE_MAJOR="22"
PYTHON_BIN="${PYTHON_BIN:-python3}"
UPDATE_WEBUI=0
UPDATE_TAG=""
UPDATE_BRANCH_PREFIX="webui-"
WITH_PYPNM_DOCSIS=0
PYPNM_DOCSIS_PATH=""
PYPNM_DOCSIS_VERSION=""
LOCAL_API_HOST=""
LOCAL_API_PORT=""
RECONFIGURE_LOCAL_AGENT=0
DEVELOPMENT_MODE=0
RUNTIME_TEMPLATE_PATH="public/config/pypnm-instances.yaml"
RUNTIME_LOCAL_PATH="public/config/pypnm-instances.local.yaml"

log() {
  printf '[install] %s\n' "$1"
}

fail() {
  printf '[install][error] %s\n' "$1" >&2
  exit 1
}

print_banner() {
  local banner_path="${ROOT_DIR}/tools/banner.txt"
  printf '\n'
  if [ -f "${banner_path}" ]; then
    cat "${banner_path}"
  else
    printf '[install] PyPNM-CMTS-WebUI installer\n'
  fi
  printf '\n'
  printf '[install] repo: %s\n' "${ROOT_DIR}"
  printf '[install] options: development=%s with_pypnm_docsis=%s update_webui=%s\n' \
    "${DEVELOPMENT_MODE}" "${WITH_PYPNM_DOCSIS}" "${UPDATE_WEBUI}"
  printf '\n'
}

ensure_base_prerequisites() {
  ensure_command git "git is required but not found. Install git and re-run."
  ensure_command curl "curl is required but not found. Install curl and re-run."
}

ensure_python_venv_support() {
  if ! "${PYTHON_BIN}" -m venv --help >/dev/null 2>&1; then
    maybe_install_python_venv_packages
    if ! "${PYTHON_BIN}" -m venv --help >/dev/null 2>&1; then
      fail "Python venv support is required but unavailable for ${PYTHON_BIN}."
    fi
  fi

  if smoke_test_python_venv_creation; then
    return
  fi

  maybe_install_python_venv_packages
  if smoke_test_python_venv_creation; then
    return
  fi

  local pyver
  pyver="$(python_minor_version)"
  fail "Python venv creation failed for ${PYTHON_BIN} (${pyver}). Install Python venv tooling (Ubuntu: sudo apt-get install -y python${pyver}-venv python3-venv python3-pip) and re-run."
}

python_minor_version() {
  env -u PYTHONPATH -u PYTHONHOME "${PYTHON_BIN}" -I - <<'EOF'
import sys
print(f"{sys.version_info.major}.{sys.version_info.minor}")
EOF
}

smoke_test_python_venv_creation() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  local venv_stderr
  venv_stderr="${tmp_dir}/venv.stderr"
  if env -u PYTHONPATH -u PYTHONHOME "${PYTHON_BIN}" -I -m venv "${tmp_dir}/check" 2>"${venv_stderr}"; then
    rm -rf "${tmp_dir}"
    return 0
  fi

  rm -rf "${tmp_dir}"
  return 1
}

maybe_install_python_venv_packages() {
  if ! command -v apt-get >/dev/null 2>&1; then
    return
  fi

  local distro_id=""
  if [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    distro_id="${ID:-}"
  fi
  case "${distro_id}" in
    ubuntu|debian)
      ;;
    *)
      return
      ;;
  esac

  local pyver
  pyver="$(python_minor_version)"
  local packages=("python${pyver}-venv" "python3-venv" "python3-pip")
  local apt_runner=()
  if [ "${EUID}" -eq 0 ]; then
    apt_runner=(apt-get)
  else
    if ! command -v sudo >/dev/null 2>&1; then
      fail "Missing sudo. Install Python venv tooling manually: sudo apt-get install -y ${packages[*]}"
    fi
    apt_runner=(sudo apt-get)
  fi

  log "Installing missing Python venv tooling via apt (${packages[*]})"
  # shellcheck disable=SC2145
  "${apt_runner[@]}" update
  if [ "${EUID}" -eq 0 ]; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y "${packages[@]}"
  else
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "${packages[@]}"
  fi
}

print_help() {
  cat <<'EOF'
Usage:
  ./install.sh
  ./install.sh --development
  ./install.sh --update-webui [tag]
  ./install.sh --with-pypnm-docsis [options]

Options:
  --development         Install Python development tooling into .venv.
  --update-webui [tag]  Update this existing checkout to the latest tag or the
                        provided tag, then reinstall dependencies and refresh
                        the local runtime config override.
  --with-pypnm-docsis   Install a local pypnm-docsis-cmts backend alongside WebUI.
  --pypnm-docsis-path   Install pypnm-docsis-cmts from a local PyPNM checkout.
  --pypnm-docsis-version
                        Install a specific pypnm-docsis-cmts version from pip.
  --local-api-host      Preselect the local API host without prompting.
  --local-api-port      Set the local API port for generated runtime config.
  --reconfigure-local-agent
                        Ignore any previously configured Local PyPNM-CMTS Agent host.
  -h, --help            Show this help.
EOF
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --update-webui)
        UPDATE_WEBUI=1
        if [ "$#" -gt 1 ] && [[ ! "$2" =~ ^- ]]; then
          UPDATE_TAG="$2"
          shift
        fi
        ;;
      --with-pypnm-docsis)
        WITH_PYPNM_DOCSIS=1
        ;;
      --development)
        DEVELOPMENT_MODE=1
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

ensure_command() {
  local cmd="$1"
  local message="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "$message"
  fi
}

prepare_nvm() {
  if [ ! -d "$HOME/.nvm" ]; then
    log "Installing nvm ${NVM_VERSION}"
    curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
  fi

  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    log "Loading nvm from ${NVM_DIR}/nvm.sh"
    # nvm.sh is not strict-mode safe under set -u in all environments.
    local had_errexit=0
    local had_nounset=0
    case "$-" in
      *e*) had_errexit=1 ;;
    esac
    case "$-" in
      *u*) had_nounset=1 ;;
    esac
    set +e +u
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
    local nvm_source_status=$?
    if [ "${had_errexit}" -eq 1 ]; then
      set -e
    fi
    if [ "${had_nounset}" -eq 1 ]; then
      set -u
    fi
    if ! command -v nvm >/dev/null 2>&1; then
      fail "Failed to initialize nvm from ${NVM_DIR}/nvm.sh"
    fi
    if [ "${nvm_source_status}" -ne 0 ]; then
      log "nvm init returned non-zero (${nvm_source_status}) but nvm is available; continuing"
    fi
  else
    fail "nvm init script not found at $NVM_DIR/nvm.sh"
  fi

  log "Installing Node ${NODE_MAJOR}"
  nvm install "$NODE_MAJOR"
  nvm use "$NODE_MAJOR"
  nvm alias default "$NODE_MAJOR" >/dev/null

  log "Node version: $(node -v)"
  log "npm version: $(npm -v)"
}

ensure_env_file() {
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      cp .env.example .env
      log "Created .env from .env.example"
    else
      fail ".env.example not found"
    fi
  else
    log "Keeping existing .env"
  fi
}

run_isolated_venv_python() {
  env -u PYTHONPATH -u PYTHONHOME .venv/bin/python -I "$@"
}

ensure_python_development_tooling() {
  if [ ! -d .venv ]; then
    log "Creating Python virtual environment (.venv)"
    env -u PYTHONPATH -u PYTHONHOME "${PYTHON_BIN}" -I -m venv .venv
  else
    log "Keeping existing Python virtual environment (.venv)"
  fi

  log "Installing Python development tooling"
  run_isolated_venv_python -m pip install --upgrade pip >/dev/null
  run_isolated_venv_python -m pip install -r tools/release/requirements.txt >/dev/null
  run_isolated_venv_python -m pip install -r requirements-docs.txt >/dev/null
}

ensure_docs_preview_browser() {
  ensure_command npx "npx is required for docs UI preview tooling. Install Node/npm and re-run."
  log "Ensuring Playwright Chromium is installed for docs UI previews"
  npx playwright install chromium >/dev/null
}

ensure_cli_shim() {
  local user_bin_dir="$HOME/.local/bin"
  local shim_path="${user_bin_dir}/pypnm-cmts-webui"
  local legacy_shim_path="${user_bin_dir}/pypnm-webui"
  local path_export='export PATH="$HOME/.local/bin:$PATH"'
  local shell_profiles=("$HOME/.bashrc" "$HOME/.profile")

  mkdir -p "$user_bin_dir"
  cat >"$shim_path" <<EOF
#!/usr/bin/env bash
exec "${ROOT_DIR}/tools/cli/pypnm-cmts-webui.js" "\$@"
EOF
  chmod +x "$shim_path"
  log "Installed CLI shim at ${shim_path}"

  cat >"$legacy_shim_path" <<EOF
#!/usr/bin/env bash
exec "${ROOT_DIR}/tools/cli/pypnm-cmts-webui.js" "\$@"
EOF
  chmod +x "$legacy_shim_path"
  log "Installed compatibility shim at ${legacy_shim_path}"

  case ":$PATH:" in
    *":${user_bin_dir}:"*)
      ;;
    *)
      local profile
      for profile in "${shell_profiles[@]}"; do
        if [ ! -f "$profile" ]; then
          touch "$profile"
        fi
        if ! grep -Fqx "$path_export" "$profile"; then
          printf '\n%s\n' "$path_export" >>"$profile"
          log "Added ${user_bin_dir} to PATH in ${profile}"
        fi
      done
      log "${user_bin_dir} is not on PATH in this shell"
      log "Run: source ~/.bashrc"
      ;;
  esac
}

merge_runtime_config_override() {
  local source_path
  if [ -f "$RUNTIME_LOCAL_PATH" ]; then
    source_path="$RUNTIME_LOCAL_PATH"
  else
    source_path="$RUNTIME_TEMPLATE_PATH"
  fi

  log "Refreshing local runtime config override"
  node --input-type=module <<EOF
import { mergeRuntimeConfigFiles } from "./tools/config-menu/runtime_config_merge.js";

mergeRuntimeConfigFiles({
  templatePath: "${RUNTIME_TEMPLATE_PATH}",
  sourcePath: "${source_path}",
  outputPath: "${RUNTIME_LOCAL_PATH}",
});
EOF
}

ensure_git_clean_for_update() {
  local status
  status="$(git status --porcelain --untracked-files=normal)"
  if [ -n "$status" ]; then
    fail "Working tree is not clean. Commit or stash tracked changes before --update-webui."
  fi
}

resolve_update_ref() {
  if [ -n "$UPDATE_TAG" ]; then
    printf '%s' "$UPDATE_TAG"
    return
  fi

  local latest_tag
  latest_tag="$(git tag --sort=-v:refname | head -n1)"
  if [ -z "$latest_tag" ]; then
    fail "No git tags found. Provide one explicitly: ./install.sh --update-webui <tag>"
  fi
  printf '%s' "$latest_tag"
}

run_update_checkout() {
  ensure_command git "git is required for --update-webui."
  ensure_git_clean_for_update

  cd "$ROOT_DIR"
  log "Fetching latest tags from origin"
  git fetch --tags origin

  local target_ref
  target_ref="$(resolve_update_ref)"
  local target_branch
  target_branch="${UPDATE_BRANCH_PREFIX}${target_ref}"
  log "Checking out ${target_ref} on branch ${target_branch}"
  git checkout -B "$target_branch" "$target_ref"
}

run_with_pypnm_docsis_helper() {
  local helper_path="${ROOT_DIR}/tools/install/with-pypnm-docsis.sh"
  [ -x "${helper_path}" ] || fail "Combined install helper is not executable: ${helper_path}"

  local helper_args=(
    --root-dir "${ROOT_DIR}"
    --python-bin "${PYTHON_BIN}"
  )

  if [ -n "${PYPNM_DOCSIS_PATH}" ]; then
    helper_args+=(--pypnm-docsis-path "${PYPNM_DOCSIS_PATH}")
  fi
  if [ -n "${PYPNM_DOCSIS_VERSION}" ]; then
    helper_args+=(--pypnm-docsis-version "${PYPNM_DOCSIS_VERSION}")
  fi
  if [ -n "${LOCAL_API_HOST}" ]; then
    helper_args+=(--local-api-host "${LOCAL_API_HOST}")
  fi
  if [ -n "${LOCAL_API_PORT}" ]; then
    helper_args+=(--local-api-port "${LOCAL_API_PORT}")
  fi
  if [ "${RECONFIGURE_LOCAL_AGENT}" -eq 1 ]; then
    helper_args+=(--reconfigure-local-agent)
  fi

  "${helper_path}" "${helper_args[@]}"
}

main() {
  parse_args "$@"
  print_banner
  ensure_base_prerequisites

  cd "$ROOT_DIR"

  if [ "$UPDATE_WEBUI" -eq 1 ]; then
    run_update_checkout
  fi

  prepare_nvm
  ensure_env_file

  log "Installing npm dependencies"
  npm ci

  log "Registering pypnm-cmts-webui CLI"
  npm link >/dev/null
  ensure_cli_shim

  merge_runtime_config_override

  if [ "${DEVELOPMENT_MODE}" -eq 1 ]; then
    ensure_command "${PYTHON_BIN}" "${PYTHON_BIN} is required for --development. Install Python 3 and re-run."
    ensure_python_venv_support
    ensure_python_development_tooling
    ensure_docs_preview_browser
  fi

  if [ "${WITH_PYPNM_DOCSIS}" -eq 1 ]; then
    ensure_command "${PYTHON_BIN}" "${PYTHON_BIN} is required for --with-pypnm-docsis. Install Python 3 and re-run."
    ensure_python_venv_support
    run_with_pypnm_docsis_helper
  fi

  log "Install complete"
  if [ "$UPDATE_WEBUI" -eq 1 ]; then
    log "Update complete"
    log "Checked out update branch: $(git branch --show-current)"
    log "Restart any running WebUI server to load the updated version"
    log "If About still shows the prior version, hard refresh the browser"
  fi
  log "Start dev server with: pypnm-cmts-webui serve"
  if [ "${WITH_PYPNM_DOCSIS}" -eq 1 ]; then
    log "Start local backend + WebUI with: pypnm-cmts-webui start-local-stack"
  fi
  if [ "${DEVELOPMENT_MODE}" -eq 1 ]; then
    log "Run release workflow with: .venv/bin/python ./tools/release/release.py --help"
  fi
  log "Edit runtime config with: pypnm-cmts-webui config-menu"
}

main "$@"
