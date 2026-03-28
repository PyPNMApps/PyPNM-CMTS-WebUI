#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys


def run(label: str, cmd: list[str]) -> int:
    print(f"[run] {label}: {' '.join(cmd)}")
    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        print(f"[fail] {label}")
        return result.returncode
    print(f"[pass] {label}")
    return 0


def main() -> int:
    steps = [
        ("lint", ["bash", "-lc", "source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npm run lint"]),
        ("test", ["bash", "-lc", "source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npm run test"]),
        ("build", ["bash", "-lc", "source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npm run build"]),
    ]
    for label, cmd in steps:
        rc = run(label, cmd)
        if rc != 0:
            return rc
    return 0


if __name__ == "__main__":
    sys.exit(main())
