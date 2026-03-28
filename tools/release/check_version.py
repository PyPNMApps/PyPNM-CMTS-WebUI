#!/usr/bin/env python3
from __future__ import annotations

import sys

from tools.support.versioning import read_package_versions, read_version_file, to_package_version


def main() -> int:
    try:
        repo_version = read_version_file()
        pkg_version, lock_version = read_package_versions()
    except RuntimeError as exc:
        print(f"ERROR: {exc}")
        return 1

    expected_package_version = to_package_version(repo_version)
    print(f"VERSION: {repo_version}")
    print(f"package.json: {pkg_version}")
    print(f"package-lock.json: {lock_version}")
    print(f"expected package version: {expected_package_version}")

    if pkg_version != lock_version:
        print("Version mismatch detected.")
        return 2

    if pkg_version != expected_package_version:
        print("VERSION to package version mismatch detected.")
        return 3

    print("Version match confirmed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
