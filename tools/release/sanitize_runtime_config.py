#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import yaml

INPUT_PATH = Path("public/config/pypnm-instances.yaml")
OUTPUT_DIR = Path("release-reports/runtime-config")
OUTPUT_PATH = OUTPUT_DIR / "pypnm-instances.sanitized.yaml"


def sanitize_runtime_config(raw: dict[str, Any]) -> dict[str, Any]:
    raw_defaults = raw.get("defaults", {}) if isinstance(raw.get("defaults", {}), dict) else {}
    sanitized = {
        "version": int(raw.get("version", 1) or 1),
        "defaults": {
            "selected_instance": "default",
            "poll_interval_ms": int(raw_defaults.get("poll_interval_ms", 5000) or 5000),
            "request_timeout_ms": int(raw_defaults.get("request_timeout_ms", 30000) or 30000),
            "health_path": str(raw_defaults.get("health_path", "/health") or "/health"),
            "logging": {
                "level": str(
                    (
                        raw_defaults.get("logging", {}).get("level", "INFO")
                        if isinstance(raw_defaults.get("logging", {}), dict)
                        else "INFO"
                    )
                    or "INFO"
                ).upper()
            },
        },
        "instances": [],
    }
    return sanitized


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sanitize public/config/pypnm-instances.yaml into a release-safe template."
    )
    parser.add_argument("--input", default=str(INPUT_PATH), help=f"Input runtime config (default: {INPUT_PATH})")
    parser.add_argument("--output", default=str(OUTPUT_PATH), help=f"Sanitized output path (default: {OUTPUT_PATH})")
    parser.add_argument(
        "--rewrite-input",
        action="store_true",
        help="Rewrite --input in-place with the sanitized template (instances removed).",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.is_file():
        print(f"ERROR: missing runtime config: {input_path}")
        return 1

    with input_path.open("r", encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}

    if not isinstance(raw, dict):
        print(f"ERROR: runtime config must be a YAML mapping: {input_path}")
        return 2

    sanitized = sanitize_runtime_config(raw)
    if args.rewrite_input:
        with input_path.open("w", encoding="utf-8") as handle:
            yaml.safe_dump(sanitized, handle, sort_keys=False)
        print(f"Sanitized runtime config written to input: {input_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(sanitized, handle, sort_keys=False)

    print(f"Sanitized runtime config written to: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
