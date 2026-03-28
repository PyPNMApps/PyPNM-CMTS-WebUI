#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="$(basename "$0")"
SCRIPT_VERSION="v1.0.0"

usage() {
  cat <<'USAGE'
Auto-commit and push the current Git repository.

Usage:
  git-push.sh [--commit-msg "Message"] [--skip-checks]

If --commit-msg is not supplied, a timestamped "Auto-push" message is used.
By default this script is intended for main/hot-fix branches.
USAGE
}

run_check() {
  local label="$1"
  shift
  echo "[check] ${label}..."
  if "$@"; then
    echo "[pass]  ${label}"
  else
    echo "[fail]  ${label}" >&2
    exit 1
  fi
}

run_quality_gates() {
  if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
    echo "ERROR: nvm not found at $HOME/.nvm/nvm.sh. Run ./install.sh first." >&2
    exit 1
  fi
  if ! bash -lc 'source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npm -v >/dev/null'; then
    echo "ERROR: npm is not available under Node 22. Run ./install.sh first." >&2
    exit 1
  fi

  run_check "npm run lint" bash -lc 'source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npm run lint'
  run_check "npm run test" bash -lc 'source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npm run test'
  run_check "npm run build" bash -lc 'source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npm run build'
}

commit_msg=""
skip_checks="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --commit-msg)
      shift
      if [[ "${1:-}" == "" ]] || [[ "${1}" =~ ^[[:space:]]*$ ]]; then
        echo "ERROR: --commit-msg requires a non-empty value." >&2
        exit 1
      fi
      commit_msg="${1}"
      shift
      ;;
    --skip-checks)
      skip_checks="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -v|--version)
      echo "${SCRIPT_NAME} ${SCRIPT_VERSION}"
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: This script must be run inside a Git repository." >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "${repo_root}"

if [[ -z "${commit_msg}" ]]; then
  commit_msg="Auto-push: $(date +'%Y-%m-%d %H:%M:%S')"
fi
current_branch="$(git rev-parse --abbrev-ref HEAD)"

if [[ "${current_branch}" == "HEAD" ]]; then
  echo "ERROR: Detached HEAD detected. Check out a branch before pushing." >&2
  exit 1
fi

if [[ "${current_branch}" != "main" && "${current_branch}" != "hot-fix" ]]; then
  echo "WARNING: Current branch is '${current_branch}' (not main/hot-fix)." >&2
  read -r -p "Continue anyway? [y/N]: " confirm
  if [[ "${confirm,,}" != "y" && "${confirm,,}" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

if git diff --quiet && git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

if [[ "${skip_checks}" != "true" ]]; then
  echo "Running quality checks..."
  run_quality_gates
else
  echo "Skipping quality checks (--skip-checks)."
fi

echo "Staging changes..."
git add -A

echo "Creating commit..."
git commit -m "${commit_msg}"

remote_name="$(git config branch."${current_branch}".remote || true)"
push_remote="${remote_name:-origin}"

echo "Pushing to ${push_remote} (${current_branch})..."
if [[ -z "${remote_name}" ]]; then
  git push -u "${push_remote}" "${current_branch}"
else
  if ! git push "${push_remote}" "${current_branch}"; then
    echo "Initial push failed; retrying with upstream setup..."
    git push -u "${push_remote}" "${current_branch}"
  fi
fi

echo "Done."
