import { describe, expect, it, vi } from "vitest";

import { mergeRuntimeConfig } from "../tools/config-menu/runtime_config_merge.js";

describe("mergeRuntimeConfig", () => {
  it("keeps local instance values while adopting new template fields", () => {
    const merged = mergeRuntimeConfig(
      {
        version: 2,
        defaults: {
          selected_instance: "lab-local",
          poll_interval_ms: 5000,
          request_timeout_ms: 30000,
          health_path: "/healthz",
          logging: { level: "INFO" },
        },
        instances: [
          {
            id: "lab-local",
            label: "Lab Local",
            base_url: "http://127.0.0.1:8080",
            enabled: true,
            tags: ["lab"],
            capabilities: ["health", "analysis", "files"],
            polling: { enabled: true, interval_ms: 5000 },
            request_defaults: {
              cable_modem: { mac_address: "", ip_address: "" },
              tftp: { ipv4: "", ipv6: "" },
              capture: { channel_ids: [] },
              snmp: { rw_community: "private" },
            },
            new_field: "template-value",
          },
        ],
      },
      {
        version: 1,
        defaults: {
          selected_instance: "lab-local",
          poll_interval_ms: 7000,
          request_timeout_ms: 45000,
          health_path: "/health",
          logging: { level: "DEBUG" },
        },
        instances: [
          {
            id: "lab-local",
            label: "My Lab",
            base_url: "http://10.0.0.5:8080",
            enabled: false,
            tags: ["custom"],
            capabilities: ["health"],
            polling: { enabled: false, interval_ms: 7000 },
            request_defaults: {
              cable_modem: { mac_address: "aa:bb:cc:dd:ee:ff", ip_address: "10.0.0.20" },
              tftp: { ipv4: "10.0.0.2", ipv6: "::1" },
              capture: { channel_ids: [193] },
              snmp: { rw_community: "secret" },
            },
          },
          {
            id: "rack-2",
            label: "Rack 2",
            base_url: "http://10.0.0.6:8080",
            enabled: true,
            tags: [],
            capabilities: ["health"],
            polling: { enabled: true, interval_ms: 5000 },
            request_defaults: {
              cable_modem: { mac_address: "", ip_address: "" },
              tftp: { ipv4: "", ipv6: "" },
              capture: { channel_ids: [] },
              snmp: { rw_community: "private" },
            },
          },
        ],
      },
    ) as {
      version: number;
      defaults: { health_path: string; selected_instance: string; logging: { level: string } };
      instances: Array<Record<string, unknown>>;
    };

    expect(merged.version).toBe(2);
    expect(merged.defaults.health_path).toBe("/health");
    expect(merged.defaults.logging.level).toBe("DEBUG");
    expect(merged.instances).toHaveLength(2);
    expect(merged.instances[0]).toMatchObject({
      id: "lab-local",
      label: "My Lab",
      base_url: "http://10.0.0.5:8080",
      new_field: "template-value",
    });
    expect(merged.instances[1]).toMatchObject({
      id: "rack-2",
      label: "Rack 2",
    });
  });

  it("logs duplicate ids within a file and keeps the first occurrence", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const merged = mergeRuntimeConfig(
      {
        version: 1,
        defaults: {
          selected_instance: "lab-local",
        },
        instances: [
          {
            id: "lab-local",
            label: "Lab Local A",
            base_url: "http://127.0.0.1:8000",
          },
          {
            id: "lab-local",
            label: "Lab Local B",
            base_url: "http://127.0.0.2:8000",
          },
        ],
      },
      {
        version: 1,
        defaults: {
          selected_instance: "rack-2",
        },
        instances: [
          {
            id: "rack-2",
            label: "Rack 2 A",
            base_url: "http://10.0.0.5:8000",
          },
          {
            id: "rack-2",
            label: "Rack 2 B",
            base_url: "http://10.0.0.6:8000",
          },
        ],
      },
    ) as {
      instances: Array<Record<string, unknown>>;
    };

    expect(merged.instances).toHaveLength(2);
    expect(merged.instances[0]).toMatchObject({
      id: "lab-local",
      label: "Lab Local A",
    });
    expect(merged.instances[1]).toMatchObject({
      id: "rack-2",
      label: "Rack 2 A",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "Duplicate PyPNM-CMTS agent ids found in template runtime config: lab-local. Keeping first occurrence only.",
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "Duplicate PyPNM-CMTS agent ids found in local runtime config: rack-2. Keeping first occurrence only.",
    );

    warnSpy.mockRestore();
  });
});
