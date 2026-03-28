import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildRuntimeConfigSchemaExample,
  ensureLocalRuntimeConfig,
  hasReservedLocalAgent,
  isReservedLocalAgentInstance,
  normalizeBaseUrl,
  normalizeConfig,
  normalizeChannelIds,
  promptSelectedInstance,
  saveConfig,
  tryNormalizeBaseUrl,
} from "../tools/config-menu/config_menu.js";

describe("config_menu normalization", () => {
  it("builds the minimal local runtime schema example", () => {
    expect(buildRuntimeConfigSchemaExample()).toEqual({
      version: 1,
      defaults: {
        selected_instance: "pypnm-agent-1",
        poll_interval_ms: 5000,
        request_timeout_ms: 30000,
        health_path: "/health",
        logging: {
          level: "INFO",
        },
      },
      instances: [],
    });
  });

  it("keeps per-instance request defaults and selected_instance", () => {
    const config = normalizeConfig({
      version: 1,
      defaults: {
        selected_instance: "denver-rack-1",
        poll_interval_ms: 7000,
        request_timeout_ms: 45000,
        health_path: "/health",
        logging: {
          level: "warn",
        },
      },
      instances: [
        {
          id: "lab-local",
          label: "Lab Local",
          base_url: "http://127.0.0.1:8080",
          enabled: true,
          polling: {
            enabled: true,
            interval_ms: 5000,
          },
          request_defaults: {
            cable_modem: {
              mac_address: "aa:bb:cc:dd:ee:ff",
              ip_address: "192.168.100.10",
            },
            tftp: {
              ipv4: "192.168.100.2",
              ipv6: "::1",
            },
            capture: {
              channel_ids: [],
            },
            snmp: {
              rw_community: "private",
            },
          },
        },
        {
          id: "denver-rack-1",
          label: "Denver Rack 1",
          base_url: "http://10.10.20.15:8080",
          enabled: true,
          polling: {
            enabled: true,
            interval_ms: 3000,
          },
          request_defaults: {
            cable_modem: {
              mac_address: "aa:bb:cc:dd:ee:11",
              ip_address: "10.10.20.44",
            },
            tftp: {
              ipv4: "10.10.20.2",
              ipv6: "",
            },
            capture: {
              channel_ids: [193],
            },
            snmp: {
              rw_community: "secret-rw",
            },
          },
        },
      ],
    });

    expect(config.defaults.selected_instance).toBe("denver-rack-1");
    expect(config.defaults.logging.level).toBe("WARN");
    expect(config.instances).toHaveLength(2);
    expect(config.instances[1]?.request_defaults).toEqual({
      cable_modem: {
        mac_address: "aa:bb:cc:dd:ee:11",
        ip_address: "10.10.20.44",
      },
      tftp: {
        ipv4: "10.10.20.2",
        ipv6: "",
      },
      capture: {
        channel_ids: [193],
      },
      snmp: {
        rw_community: "secret-rw",
      },
    });
  });

  it("treats 0 as all channels in normalization helpers", () => {
    expect(normalizeChannelIds("0")).toEqual([]);
    expect(normalizeChannelIds("193,194")).toEqual([193, 194]);
    expect(normalizeChannelIds([193, 194])).toEqual([193, 194]);
  });

  it("accepts numbered selected_instance input", async () => {
    const prompts: string[] = [];
    const selected = await promptSelectedInstance(
      {
        question: async (prompt: string) => {
          prompts.push(prompt);
          return "2";
        },
      },
      [
        { id: "lab-local", label: "Lab Local" },
        { id: "denver-rack-1", label: "Denver Rack 1" },
      ],
      "lab-local",
    );

    expect(prompts).toEqual(["Selected instance [1]: "]);
    expect(selected).toBe("denver-rack-1");
  });

  it("normalizes base_url values that omit protocol", () => {
    const config = normalizeConfig({
      defaults: { selected_instance: "lab-local" },
      instances: [{ id: "lab-local", label: "Lab Local", base_url: "172.19.8.28:8000" }],
    });

    expect(config.instances[0]?.base_url).toBe("http://172.19.8.28:8000");
  });

  it("normalizes health_path to always include a leading slash", () => {
    const config = normalizeConfig({
      defaults: {
        selected_instance: "lab-local",
        health_path: "healthz",
      },
      instances: [{ id: "lab-local", label: "Lab Local", base_url: "http://127.0.0.1:8080" }],
    });

    expect(config.defaults.health_path).toBe("/healthz");
  });

  it("falls back for invalid base_url values", () => {
    const config = normalizeConfig({
      defaults: { selected_instance: "lab-local" },
      instances: [{ id: "lab-local", label: "Lab Local", base_url: "not a url $$" }],
    });

    expect(config.instances[0]?.base_url).toBe("http://127.0.0.1:8080");
  });

  it("validates and normalizes base URLs", () => {
    expect(tryNormalizeBaseUrl("172.19.8.28:8000")).toEqual({
      ok: true,
      value: "http://172.19.8.28:8000",
    });
    expect(tryNormalizeBaseUrl("ftp://172.19.8.28:21")).toEqual({
      ok: false,
      value: "",
      error: "Base URL must use http or https.",
    });
    expect(normalizeBaseUrl("")).toBe("http://127.0.0.1:8080");
  });

  it("creates a backup before overwriting an existing config", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pypnm-webui-config-menu-"));
    const configPath = path.join(tempDir, "pypnm-instances.yaml");

    saveConfig(
      configPath,
      normalizeConfig({
        defaults: { selected_instance: "lab-local" },
        instances: [{ id: "lab-local", label: "Lab Local", base_url: "http://127.0.0.1:8080" }],
      }),
    );

    saveConfig(
      configPath,
      normalizeConfig({
        defaults: { selected_instance: "denver-rack-1" },
        instances: [{ id: "denver-rack-1", label: "Denver Rack 1", base_url: "http://10.10.20.15:8080" }],
      }),
    );

    const files = fs.readdirSync(tempDir);
    const backupFiles = files.filter((file) => file.startsWith("pypnm-instances.yaml.") && file.endsWith(".bak"));

    expect(backupFiles).toHaveLength(1);
    expect(fs.readFileSync(path.join(tempDir, backupFiles[0]), "utf8")).toContain("selected_instance: lab-local");
  });

  it("rejects saving config with duplicate agent ids", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pypnm-webui-config-menu-invalid-"));
    const configPath = path.join(tempDir, "pypnm-instances.yaml");
    const badConfig = normalizeConfig({
      defaults: {
        selected_instance: "lab-local",
      },
      instances: [
        { id: "lab-local", label: "Lab Local", base_url: "http://127.0.0.1:8080" },
        { id: "lab-local", label: "Lab Local 2", base_url: "http://127.0.0.1:8081" },
      ],
    });

    expect(() => saveConfig(configPath, badConfig)).toThrow("Duplicate instance id found: lab-local");
  });

  it("auto generates a local runtime yaml when none exists", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pypnm-webui-runtime-config-"));
    const localConfigPath = path.join(tempDir, "pypnm-instances.local.yaml");
    const templateConfigPath = path.join(tempDir, "pypnm-instances.yaml");

    fs.writeFileSync(
      templateConfigPath,
      [
        "version: 1",
        "defaults:",
        "  selected_instance: lab-local",
        "instances:",
        "  - id: lab-local",
        "    label: Lab Local",
        "    base_url: http://127.0.0.1:8000",
        "",
      ].join("\n"),
      "utf8",
    );

    const generated = ensureLocalRuntimeConfig(localConfigPath, templateConfigPath);

    expect(fs.existsSync(localConfigPath)).toBe(true);
    expect(generated.generated).toBe(true);
    expect(generated.config.defaults.selected_instance).toBe("lab-local");
    expect(fs.readFileSync(localConfigPath, "utf8")).toContain("selected_instance: lab-local");
    expect(fs.readFileSync(localConfigPath, "utf8")).toContain("label: Lab Local");
  });

  it("preserves a minimal template with empty instances", () => {
    const config = normalizeConfig({
      version: 1,
      defaults: {
        selected_instance: "pypnm-agent-1",
        poll_interval_ms: 5000,
        request_timeout_ms: 30000,
        health_path: "/health",
        logging: { level: "INFO" },
      },
      instances: [],
    });

    expect(config.instances).toEqual([]);
    expect(config.defaults.selected_instance).toBe("pypnm-agent-1");
  });

  it("detects reserved local-pypnm-agent entries only when combined-install tagged", () => {
    expect(
      isReservedLocalAgentInstance({
        id: "local-pypnm-agent",
        tags: ["local", "combined-install"],
      }),
    ).toBe(true);
    expect(
      isReservedLocalAgentInstance({
        id: "local-pypnm-agent",
        tags: ["local"],
      }),
    ).toBe(false);
    expect(
      hasReservedLocalAgent({
        instances: [
          { id: "lab-local", tags: ["lab"] },
          { id: "local-pypnm-agent", tags: ["combined-install"] },
        ],
      }),
    ).toBe(true);
  });
});
