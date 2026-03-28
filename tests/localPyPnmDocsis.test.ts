import { describe, expect, it } from "vitest";

import {
  LOCAL_PYPNM_INSTANCE_ID,
  applyLocalPyPnmAgentConfig,
  buildLocalPyPnmInstance,
  choosePreferredLocalHost,
  parseIpv4Candidates,
  readConfiguredLocalPyPnmHost,
  readConfiguredLocalPyPnmPort,
} from "../tools/install/local_pypnm_docsis.js";

describe("local_pypnm_docsis", () => {
  it("builds a default local PyPNM-CMTS agent entry", () => {
    expect(buildLocalPyPnmInstance("172.19.8.28")).toMatchObject({
      id: LOCAL_PYPNM_INSTANCE_ID,
      label: "Local PyPNM-CMTS Agent",
      base_url: "http://172.19.8.28:8000",
      enabled: true,
      capabilities: ["health", "analysis", "files"],
      request_defaults: {
        tftp: {
          ipv4: "172.19.8.28",
          ipv6: "::1",
        },
      },
    });
  });

  it("builds a local PyPNM-CMTS agent entry with an explicit API port", () => {
    expect(buildLocalPyPnmInstance("172.19.8.28", 8081)).toMatchObject({
      base_url: "http://172.19.8.28:8081",
      request_defaults: {
        tftp: {
          ipv4: "172.19.8.28",
        },
      },
    });
  });

  it("merges a generated local agent into the local runtime config and selects it", () => {
    const merged = applyLocalPyPnmAgentConfig(
      {
        version: 1,
        defaults: {
          selected_instance: "lab-local",
        },
        instances: [
          {
            id: "lab-local",
            label: "Lab Local",
            base_url: "http://10.0.0.5:8000",
            enabled: true,
            tags: ["lab"],
            capabilities: ["health"],
          },
        ],
      },
      {
        version: 1,
        defaults: {
          selected_instance: "lab-local",
        },
        instances: [
          {
            id: "lab-local",
            label: "Rack 2",
            base_url: "http://10.0.0.6:8000",
            enabled: true,
          },
          {
            id: LOCAL_PYPNM_INSTANCE_ID,
            label: "Old Local Name",
            base_url: "http://127.0.0.1:8000",
            enabled: false,
            request_defaults: {
              cable_modem: {
                mac_address: "aa:bb:cc:dd:ee:ff",
                ip_address: "10.0.0.20",
              },
              tftp: {
                ipv4: "127.0.0.1",
                ipv6: "::1",
              },
              capture: {
                channel_ids: [193],
              },
              snmp: {
                rw_community: "secret",
              },
            },
          },
        ],
      },
      "172.19.8.28",
    ) as {
      defaults: { selected_instance: string };
      instances: Array<Record<string, unknown>>;
    };

    expect(merged.defaults.selected_instance).toBe(LOCAL_PYPNM_INSTANCE_ID);
    expect(merged.instances.find((instance) => instance.id === LOCAL_PYPNM_INSTANCE_ID)).toMatchObject({
      id: LOCAL_PYPNM_INSTANCE_ID,
      label: "Old Local Name",
      base_url: "http://127.0.0.1:8000",
      enabled: false,
      capabilities: ["health", "analysis", "files"],
    });
    expect(merged.instances.find((instance) => instance.id === "lab-local")).toMatchObject({
      id: "lab-local",
      label: "Rack 2",
    });
  });

  it("reads the configured local host from the generated instance", () => {
    expect(
      readConfiguredLocalPyPnmHost({
        instances: [
          {
            id: LOCAL_PYPNM_INSTANCE_ID,
            base_url: "http://172.19.8.28:8000",
          },
        ],
      }),
    ).toBe("172.19.8.28");
  });

  it("reads the configured local port from the generated instance", () => {
    expect(
      readConfiguredLocalPyPnmPort({
        instances: [
          {
            id: LOCAL_PYPNM_INSTANCE_ID,
            base_url: "http://172.19.8.28:8081",
          },
        ],
      }),
    ).toBe(8081);
  });

  it("parses unique IPv4 candidates from shell output", () => {
    expect(
      parseIpv4Candidates(`
        lo 127.0.0.1/8
        eth0 172.19.8.28/24
        eth0 172.19.8.28/24
        wlan0 192.168.1.44/24
      `),
    ).toEqual([
      { iface: "lo", ip: "127.0.0.1" },
      { iface: "eth0", ip: "172.19.8.28" },
      { iface: "wlan0", ip: "192.168.1.44" },
    ]);
  });

  it("chooses an explicit or existing host without prompting and falls back sanely", () => {
    expect(
      choosePreferredLocalHost({
        explicitHost: "192.168.1.10",
        candidates: [{ iface: "eth0", ip: "172.19.8.28" }],
      }),
    ).toMatchObject({
      host: "192.168.1.10",
      source: "explicit",
      needsPrompt: false,
    });

    expect(
      choosePreferredLocalHost({
        existingHost: "172.19.8.28",
        candidates: [{ iface: "eth0", ip: "172.19.8.29" }],
      }),
    ).toMatchObject({
      host: "172.19.8.28",
      source: "existing",
      needsPrompt: false,
    });

    expect(
      choosePreferredLocalHost({
        candidates: [{ iface: "eth0", ip: "172.19.8.28" }],
        isInteractive: false,
      }),
    ).toMatchObject({
      host: "127.0.0.1",
      source: "non-interactive-default",
      needsPrompt: false,
    });
  });

  it("offers loopback and interface choices when interactive selection is needed", () => {
    const decision = choosePreferredLocalHost({
      candidates: [{ iface: "eth0", ip: "172.19.8.28" }],
      isInteractive: true,
    });

    expect(decision.needsPrompt).toBe(true);
    expect(decision.choices).toEqual([
      {
        label: "Loopback only",
        host: "127.0.0.1",
        detail: "Use the backend from the same machine only.",
      },
      {
        label: "eth0 (172.19.8.28)",
        host: "172.19.8.28",
        detail: "Use the detected interface address.",
      },
    ]);
  });

  it("dedupes preserved local instances that point to the same base_url as Local PyPNM-CMTS Agent", () => {
    const merged = applyLocalPyPnmAgentConfig(
      {
        version: 1,
        defaults: {
          selected_instance: "lab-local",
        },
        instances: [],
      },
      {
        version: 1,
        defaults: {
          selected_instance: "lab-local",
        },
        instances: [
          {
            id: "lab-local",
            label: "Lab Local",
            base_url: "http://172.19.8.28:8000",
            enabled: true,
          },
        ],
      },
      "172.19.8.28",
    ) as {
      instances: Array<Record<string, unknown>>;
    };

    expect(merged.instances).toHaveLength(1);
    expect(merged.instances[0]).toMatchObject({
      id: LOCAL_PYPNM_INSTANCE_ID,
      base_url: "http://172.19.8.28:8000",
    });
  });

  it("keeps preserved instances when only host matches but port differs", () => {
    const merged = applyLocalPyPnmAgentConfig(
      {
        version: 1,
        defaults: {
          selected_instance: "lab-local",
        },
        instances: [],
      },
      {
        version: 1,
        defaults: {
          selected_instance: "lab-local",
        },
        instances: [
          {
            id: "lab-local",
            label: "Lab Local",
            base_url: "http://172.19.8.28:8000",
            enabled: true,
          },
        ],
      },
      "172.19.8.28",
      8081,
    ) as {
      instances: Array<Record<string, unknown>>;
    };

    expect(merged.instances).toHaveLength(2);
    expect(merged.instances[0]).toMatchObject({
      id: LOCAL_PYPNM_INSTANCE_ID,
      base_url: "http://172.19.8.28:8081",
    });
    expect(merged.instances[1]).toMatchObject({
      id: "lab-local",
      base_url: "http://172.19.8.28:8000",
    });
  });
});
