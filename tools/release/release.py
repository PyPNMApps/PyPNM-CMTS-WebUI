#!/usr/bin/env python3
from __future__ import annotations

import argparse
import atexit
import re
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path

from tools.support.versioning import read_version_file

SUMMARY: dict[str, str] = {}
RELEASE_LOG_DIR: Path | None = None
REPORT_DIR = Path("release-reports") / "logs"
BUMP_SCRIPT = Path("tools/support/bump_version.py")
SANITIZE_RUNTIME_CONFIG_SCRIPT = Path("tools/release/sanitize_runtime_config.py")


def _print_banner() -> None:
    banner_path = Path(__file__).resolve().parent.parent / "banner.txt"
    if banner_path.is_file():
        print(banner_path.read_text(encoding="utf-8"))


def _colorize(text: str, color: str) -> str:
    if not sys.stdout.isatty():
        return text
    codes = {
        "green": "\033[32m",
        "red": "\033[31m",
        "yellow": "\033[33m",
        "reset": "\033[0m",
    }
    return f"{codes.get(color, '')}{text}{codes['reset']}"


def _print_status(label: str, state: str) -> None:
    SUMMARY[label] = state
    if state == "pass":
        value = _colorize("PASS", "green")
    elif state == "fail":
        value = _colorize("FAIL", "red")
    else:
        value = _colorize("SKIP", "yellow")
    print(f"{value} {label}")


def _print_summary() -> None:
    if not SUMMARY:
        return
    print("\nRelease step summary:")
    for key, value in SUMMARY.items():
        print(f" {value.upper():4} {key}")
    if RELEASE_LOG_DIR:
        print(f"Failure logs (if any) stored in: {RELEASE_LOG_DIR}")


def _init_release_logging() -> None:
    global RELEASE_LOG_DIR
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    RELEASE_LOG_DIR = Path(tempfile.mkdtemp(prefix="pypnm-webui-release-logs-", dir=str(REPORT_DIR)))


def _sanitize_label(label: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_.-]+", "-", label.strip().lower())
    return safe or "cmd"


def _run(cmd: list[str], *, label: str, check: bool = True, capture_output: bool = True) -> subprocess.CompletedProcess[str]:
    if capture_output:
        result = subprocess.run(cmd, text=True, capture_output=True, check=False)
    else:
        result = subprocess.run(cmd, text=True, check=False)

    if result.returncode != 0 and RELEASE_LOG_DIR is not None:
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        log_path = RELEASE_LOG_DIR / f"{_sanitize_label(label)}-{stamp}.log"
        stdout = result.stdout or ""
        stderr = result.stderr or ""
        log_path.write_text(
            f"$ {' '.join(cmd)}\n\nSTDOUT:\n{stdout}\n\nSTDERR:\n{stderr}\n",
            encoding="utf-8",
        )
        print(f"[release] {label} failed; see {log_path}")

    if result.returncode != 0 and check:
        raise subprocess.CalledProcessError(result.returncode, cmd, output=result.stdout, stderr=result.stderr)

    return result


def _ensure_git_clean() -> None:
    result = _run(["git", "status", "--porcelain"], label="git-status")
    if (result.stdout or "").strip():
        raise RuntimeError("Working tree is not clean. Commit or stash changes first.")


def _ensure_release_branch_allowed() -> str:
    branch = _run(["git", "rev-parse", "--abbrev-ref", "HEAD"], label="git-branch").stdout.strip()
    if branch not in ("main", "hot-fix"):
        raise RuntimeError("Release can only run on 'main' or 'hot-fix'.")
    return branch


def _get_repo_version() -> str:
    return read_version_file()


def _bump_version(*, explicit_version: str | None, next_mode: str | None) -> tuple[str, bool]:
    if explicit_version is not None and next_mode is not None:
        raise RuntimeError("--version and --next cannot be used together.")
    effective_next_mode = next_mode if next_mode is not None else "maintenance"

    if not BUMP_SCRIPT.is_file():
        raise RuntimeError(f"Missing bump script: {BUMP_SCRIPT}")

    if explicit_version is not None:
        _run([sys.executable, str(BUMP_SCRIPT), explicit_version], label="bump-version", capture_output=False)
    else:
        _run([sys.executable, str(BUMP_SCRIPT), "--next", effective_next_mode], label="bump-version", capture_output=False)
    return _get_repo_version(), True


def _run_step(name: str, cmd: list[str], *, enabled: bool) -> None:
    if not enabled:
        _print_status(name, "skip")
        return
    try:
        _run(cmd, label=name, capture_output=False)
    except subprocess.CalledProcessError:
        _print_status(name, "fail")
        raise
    _print_status(name, "pass")


def _npm_cmd(script: str) -> list[str]:
    shell_cmd = f"source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npm run {script}"
    return ["bash", "-lc", shell_cmd]


def _commit_release(commit_message: str) -> None:
    _run(["git", "add", "-A"], label="git-add", capture_output=False)
    _run(["git", "commit", "-m", commit_message], label="git-commit", capture_output=False)


def _has_pending_changes() -> bool:
    result = _run(["git", "status", "--porcelain"], label="git-status-post-check")
    return bool((result.stdout or "").strip())


def _create_tag(tag_name: str) -> None:
    _run(["git", "tag", "-a", tag_name, "-m", f"Release {tag_name}"], label="git-tag", capture_output=False)


def _push_branch_and_tag(branch: str, tag_name: str, *, push: bool, tag: bool) -> None:
    if not push:
        _print_status("git-push-branch", "skip")
        _print_status("git-push-tag", "skip")
        return
    _run(["git", "push", "origin", branch], label="git-push-branch", capture_output=False)
    _print_status("git-push-branch", "pass")
    if tag:
        _run(["git", "push", "origin", tag_name], label="git-push-tag", capture_output=False)
        _print_status("git-push-tag", "pass")
    else:
        _print_status("git-push-tag", "skip")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="PyPNM-WebUI release workflow")
    parser.add_argument("--commit-msg", default="Release", help="Commit message prefix")
    parser.add_argument("--version", help="Explicit version to set before release (MAJOR.MINOR.MAINTENANCE.BUILD)")
    parser.add_argument("--next", choices=["major", "minor", "maintenance", "build"], help="Compute and apply next version")
    parser.add_argument("--allow-dirty", action="store_true", help="Allow running with uncommitted changes")
    parser.add_argument("--skip-lint", action="store_true", help="Skip npm run lint")
    parser.add_argument("--skip-test", action="store_true", help="Skip npm run test")
    parser.add_argument("--skip-build", action="store_true", help="Skip npm run build")
    parser.add_argument(
        "--with-docs-previews",
        action="store_true",
        help="Include npm run docs:capture-ui-previews in release flow (default: off)",
    )
    parser.add_argument(
        "--skip-docs-previews",
        action="store_true",
        help="Alias for not running docs UI previews (default behavior)",
    )
    parser.add_argument(
        "--with-live-endpoint-examples",
        action="store_true",
        help="Include npm run docs:capture-live-endpoint-examples in release flow (default: off)",
    )
    parser.add_argument(
        "--skip-live-endpoint-examples",
        action="store_true",
        help="Alias for not running live endpoint examples (default behavior)",
    )
    parser.add_argument(
        "--skip-sanitize-runtime-config",
        action="store_true",
        help="Skip sanitizing public/config/pypnm-instances.yaml and generating the release runtime-config artifact",
    )
    parser.add_argument("--no-tag", action="store_true", help="Do not create or push a git tag")
    parser.add_argument("--no-push", action="store_true", help="Do not push branch/tag to origin")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    _print_banner()
    _init_release_logging()

    if args.with_live_endpoint_examples and args.skip_live_endpoint_examples:
        raise RuntimeError("Cannot use --with-live-endpoint-examples and --skip-live-endpoint-examples together.")

    if not args.allow_dirty:
        try:
            _ensure_git_clean()
            _print_status("git-clean", "pass")
        except Exception:
            _print_status("git-clean", "fail")
            raise
    else:
        _print_status("git-clean", "skip")

    branch = _ensure_release_branch_allowed()
    _print_status("release-branch", "pass")

    version_before = _get_repo_version()
    version, bumped = _bump_version(explicit_version=args.version, next_mode=args.next)
    if not bumped:
        _print_status("bump-version", "skip")
    elif version == version_before:
        _print_status("bump-version", "skip")
    else:
        _print_status("bump-version", "pass")

    _run_step("npm-lint", _npm_cmd("lint"), enabled=not args.skip_lint)
    _run_step("npm-test", _npm_cmd("test"), enabled=not args.skip_test)
    _run_step("npm-build", _npm_cmd("build"), enabled=not args.skip_build)
    _run_step(
        "npm-live-endpoint-examples",
        _npm_cmd("docs:capture-live-endpoint-examples"),
        enabled=args.with_live_endpoint_examples and not args.skip_live_endpoint_examples,
    )
    _run_step(
        "npm-docs-previews",
        _npm_cmd("docs:capture-ui-previews"),
        enabled=args.with_docs_previews and not args.skip_docs_previews,
    )
    _run_step(
        "sanitize-runtime-config",
        [sys.executable, str(SANITIZE_RUNTIME_CONFIG_SCRIPT), "--rewrite-input"],
        enabled=not args.skip_sanitize_runtime_config,
    )

    tag_name = f"v{version}"
    commit_message = f"{args.commit_msg} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

    if not _has_pending_changes():
        _print_status("git-commit", "skip")
        _print_status("git-tag", "skip")
        _print_status("git-push-branch", "skip")
        _print_status("git-push-tag", "skip")
        return

    _commit_release(commit_message)
    _print_status("git-commit", "pass")

    if not args.no_tag:
        _create_tag(tag_name)
        _print_status("git-tag", "pass")
    else:
        _print_status("git-tag", "skip")

    _push_branch_and_tag(branch, tag_name, push=not args.no_push, tag=not args.no_tag)


if __name__ == "__main__":
    atexit.register(_print_summary)
    try:
        main()
    except Exception as exc:
        print(f"[fail] release aborted: {exc}", file=sys.stderr)
        sys.exit(1)
