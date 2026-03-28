#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from tools.support.versioning import compute_next_version, read_version_file, to_package_version, write_package_versions, write_version_file


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Inspect or update the repository VERSION file and the derived npm package version. "
            "VERSION format: MAJOR.MINOR.MAINTENANCE.BUILD."
        )
    )
    parser.add_argument("version", nargs="?", help="Explicit version to set")
    parser.add_argument("--current", action="store_true", help="Show current version and exit")
    parser.add_argument("--next", choices=["major", "minor", "maintenance", "build"], help="Compute and apply next version")
    args = parser.parse_args()

    if args.current and (args.version or args.next):
        print("ERROR: --current cannot be combined with version or --next.", file=sys.stderr)
        return 1

    try:
        current = read_version_file()
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.current:
        print(f"Current version: {current}")
        print(f"Package version: {to_package_version(current)}")
        return 0

    if args.version and args.next:
        print("ERROR: explicit version and --next cannot be combined.", file=sys.stderr)
        return 1

    if args.next:
        try:
            target = compute_next_version(current, args.next)
            write_version_file(target)
            write_package_versions(target)
        except RuntimeError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 1
        print(f"Updated version: {current} -> {target}")
        print(f"Updated package version: {to_package_version(target)}")
        return 0

    if args.version:
        try:
            write_version_file(args.version)
            write_package_versions(args.version)
        except RuntimeError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 1
        if current == args.version:
            print(f"No change: version already {current}")
            return 0
        print(f"Updated version: {current} -> {args.version}")
        print(f"Updated package version: {to_package_version(args.version)}")
        return 0

    print("ERROR: specify one of --current, --next, or explicit version.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
