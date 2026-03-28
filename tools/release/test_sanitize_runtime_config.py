#!/usr/bin/env python3
from __future__ import annotations

import unittest

from tools.release.sanitize_runtime_config import sanitize_runtime_config


class SanitizeRuntimeConfigTests(unittest.TestCase):
    def test_sanitize_runtime_config_keeps_template_structure_and_clears_instances(self) -> None:
        sanitized = sanitize_runtime_config(
            {
                "version": 1,
                "defaults": {
                    "selected_instance": "rack-2",
                    "poll_interval_ms": 4000,
                    "request_timeout_ms": 45000,
                    "health_path": "/health",
                    "logging": {
                        "level": "debug",
                    },
                },
                "instances": [
                    {
                        "id": "rack-1",
                        "label": "Rack 1",
                        "base_url": "http://10.0.0.5:8080",
                        "enabled": True,
                        "tags": ["lab"],
                        "capabilities": ["health", "analysis"],
                        "polling": {"enabled": True, "interval_ms": 4000},
                        "request_defaults": {
                            "cable_modem": {"mac_address": "de:ad:be:ef:00:01", "ip_address": "10.0.0.20"},
                            "tftp": {"ipv4": "10.0.0.2", "ipv6": "2001:db8::1"},
                            "capture": {"channel_ids": [193]},
                            "snmp": {"rw_community": "super-secret"},
                        },
                    },
                    {
                        "id": "rack-2",
                        "label": "Rack 2",
                        "base_url": "http://10.0.0.6:8080",
                    },
                ],
            }
        )

        self.assertEqual(sanitized["version"], 1)
        self.assertEqual(sanitized["defaults"]["selected_instance"], "default")
        self.assertEqual(sanitized["defaults"]["poll_interval_ms"], 4000)
        self.assertEqual(sanitized["defaults"]["request_timeout_ms"], 45000)
        self.assertEqual(sanitized["defaults"]["health_path"], "/health")
        self.assertEqual(sanitized["defaults"]["logging"]["level"], "DEBUG")
        self.assertEqual(sanitized["instances"], [])


if __name__ == "__main__":
    unittest.main()
