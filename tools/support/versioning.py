#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path


VERSION_FILE = Path("VERSION")
PACKAGE_JSON = Path("package.json")
PACKAGE_LOCK = Path("package-lock.json")
VERSION_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)\.(\d+)$")


def read_version_file() -> str:
    if not VERSION_FILE.is_file():
        raise RuntimeError(f"Missing version file: {VERSION_FILE}")
    value = VERSION_FILE.read_text(encoding="utf-8").strip()
    validate_version(value)
    return value


def write_version_file(version: str) -> None:
    validate_version(version)
    VERSION_FILE.write_text(f"{version}\n", encoding="utf-8")


def validate_version(version: str) -> tuple[int, int, int, int]:
    match = VERSION_RE.fullmatch(version.strip())
    if not match:
        raise RuntimeError(
            f"Invalid version '{version}'. Expected MAJOR.MINOR.MAINTENANCE.BUILD.",
        )
    return tuple(int(part) for part in match.groups())


def to_package_version(version: str) -> str:
    major, minor, maintenance, _build = validate_version(version)
    return f"{major}.{minor}.{maintenance}"


def read_package_versions() -> tuple[str, str]:
    package = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    package_lock = json.loads(PACKAGE_LOCK.read_text(encoding="utf-8"))
    package_version = package.get("version", "")
    lock_version = package_lock.get("version", "")
    if not isinstance(package_version, str) or not package_version:
        raise RuntimeError("package.json missing version")
    if not isinstance(lock_version, str) or not lock_version:
        raise RuntimeError("package-lock.json missing version")
    return package_version, lock_version


def write_package_versions(version: str) -> None:
    package_version = to_package_version(version)
    package = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    package_lock = json.loads(PACKAGE_LOCK.read_text(encoding="utf-8"))

    package["version"] = package_version
    if isinstance(package_lock.get("version"), str):
        package_lock["version"] = package_version

    packages = package_lock.get("packages")
    if isinstance(packages, dict) and isinstance(packages.get(""), dict):
        root_package = packages[""]
        if isinstance(root_package.get("version"), str):
            root_package["version"] = package_version

    PACKAGE_JSON.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")
    PACKAGE_LOCK.write_text(json.dumps(package_lock, indent=2) + "\n", encoding="utf-8")


def compute_next_version(current: str, mode: str) -> str:
    major, minor, maintenance, build = validate_version(current)
    if mode == "major":
        return f"{major + 1}.0.0.0"
    if mode == "minor":
        return f"{major}.{minor + 1}.0.0"
    if mode == "maintenance":
        return f"{major}.{minor}.{maintenance + 1}.0"
    if mode == "build":
        return f"{major}.{minor}.{maintenance}.{build + 1}"
    raise RuntimeError(f"Unsupported --next mode '{mode}'.")
