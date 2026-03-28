#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="$(basename "$0")"

REMOTE="origin"
BRANCH="main"
COMMIT_MESSAGE="Initial clean commit"
ALLOW_DIRTY_WORKTREE="0"
CREATE_BACKUP="1"

usage() {
  cat <<USAGE
$SCRIPT_NAME - Rewrite A Git Branch As A Fresh Orphan History

Usage:
  $SCRIPT_NAME [options]

Options:
  --remote NAME          Remote name to push to (default: origin)
  --branch NAME          Branch name to rewrite (default: main)
  --message TEXT         Commit message for the new initial commit
                         (default: "Initial clean commit")
  --allow-dirty          Allow running with a dirty working tree.
  --no-backup            Do NOT create a backup branch before rewriting.
  --help, -h             Show this help message and exit.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)
      REMOTE="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --message)
      COMMIT_MESSAGE="$2"
      shift 2
      ;;
    --allow-dirty)
      ALLOW_DIRTY_WORKTREE="1"
      shift
      ;;
    --no-backup)
      CREATE_BACKUP="0"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: This script must be run inside a git repository."
  exit 1
fi

if [[ "$ALLOW_DIRTY_WORKTREE" != "1" ]] && [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: Working tree is not clean."
  echo "       Commit, stash, or discard changes before running this script,"
  echo "       or re-run with --allow-dirty if you are sure."
  exit 1
fi

echo "Remote: $REMOTE"
echo "Branch: $BRANCH"
read -r -p "Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "Aborted by user."
  exit 1
fi

echo "Fetching latest refs from '$REMOTE'..."
git fetch "$REMOTE"

echo "Checking out branch '$BRANCH'..."
git checkout "$BRANCH"

echo "Pulling latest from '$REMOTE/$BRANCH'..."
git pull "$REMOTE" "$BRANCH"

BACKUP_BRANCH=""
if [[ "$CREATE_BACKUP" == "1" ]]; then
  CURRENT_COMMIT="$(git rev-parse HEAD)"
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  BACKUP_BRANCH="${BRANCH}-backup-${TIMESTAMP}"

  echo "Creating backup branch '$BACKUP_BRANCH' at $CURRENT_COMMIT..."
  git branch "$BACKUP_BRANCH" "$CURRENT_COMMIT"

  echo "Pushing backup branch '$BACKUP_BRANCH' to remote '$REMOTE'..."
  git push "$REMOTE" "$BACKUP_BRANCH"
fi

ORPHAN_BRANCH="__orphan_reset_${BRANCH}"

echo "Creating orphan branch '$ORPHAN_BRANCH'..."
git checkout --orphan "$ORPHAN_BRANCH"

echo "Staging all files for new initial commit..."
git add -A

echo "Creating new initial commit..."
git commit -m "$COMMIT_MESSAGE"

echo "Renaming orphan branch '$ORPHAN_BRANCH' to '$BRANCH'..."
git branch -M "$BRANCH"

echo "Force-pushing rewritten branch '$BRANCH' to remote '$REMOTE'..."
git push -f "$REMOTE" "$BRANCH"

echo "Done."
if [[ "$CREATE_BACKUP" == "1" ]]; then
  echo "Previous history is preserved on backup branch: $BACKUP_BRANCH"
fi
