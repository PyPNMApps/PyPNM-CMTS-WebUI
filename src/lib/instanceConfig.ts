import { parse } from "yaml";

import { env } from "@/lib/env";
import type { PypnmInstance, PypnmInstanceConfig, PypnmLogLevel, PypnmRequestDefaults } from "@/types/config";

const STORAGE_KEY = "pypnm.selectedInstance";
const TEMPLATE_CONFIG_URL = "/config/pypnm-instances.yaml";
const LOCAL_OVERRIDE_CONFIG_URL = "/config/pypnm-instances.local.yaml";

interface RawInstanceConfig {
  version?: number;
  defaults?: {
    selected_instance?: string;
    poll_interval_ms?: number;
    request_timeout_ms?: number;
    health_path?: string;
    logging?: {
      level?: string;
    };
  };
  instances?: Array<{
    id?: string;
    label?: string;
    base_url?: string;
    enabled?: boolean;
    tags?: string[];
    capabilities?: string[];
    polling?: {
      enabled?: boolean;
      interval_ms?: number;
    };
    request_defaults?: {
      cable_modem?: {
        mac_address?: string;
        ip_address?: string;
      };
      tftp?: {
        ipv4?: string;
        ipv6?: string;
      };
      capture?: {
        channel_ids?: number[] | string;
      };
      snmp?: {
        rw_community?: string;
      };
    };
  }>;
}

type RawInstanceEntry = NonNullable<RawInstanceConfig["instances"]>[number];

function normalizeLogLevel(value: unknown): PypnmLogLevel {
  switch (typeof value === "string" ? value.trim().toUpperCase() : "") {
    case "DEBUG":
      return "DEBUG";
    case "WARN":
    case "WARNING":
      return "WARN";
    case "ERROR":
      return "ERROR";
    case "OFF":
      return "OFF";
    case "INFO":
    default:
      return "INFO";
  }
}

interface RawRequestDefaults {
  cable_modem?: {
    mac_address?: string;
    ip_address?: string;
  };
  tftp?: {
    ipv4?: string;
    ipv6?: string;
  };
  capture?: {
    channel_ids?: number[] | string;
  };
  snmp?: {
    rw_community?: string;
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function dedupeRawInstances(
  instances: RawInstanceEntry[] | undefined,
  sourceLabel: string,
): RawInstanceEntry[] {
  const nextInstances = Array.isArray(instances) ? instances : [];
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();
  const deduped: RawInstanceEntry[] = [];

  for (const instance of nextInstances) {
    const instanceId = typeof instance?.id === "string" ? instance.id.trim() : "";
    if (instanceId === "") {
      deduped.push(instance);
      continue;
    }

    if (seenIds.has(instanceId)) {
      duplicateIds.add(instanceId);
      continue;
    }

    seenIds.add(instanceId);
    deduped.push(instance);
  }

  if (duplicateIds.size > 0) {
    console.warn(
      `Duplicate PyPNM-CMTS agent ids found in ${sourceLabel}: ${Array.from(duplicateIds).join(", ")}. Keeping first occurrence only.`,
    );
  }

  return deduped;
}

function sanitizeRawConfig(raw: RawInstanceConfig, sourceLabel: string): RawInstanceConfig {
  return {
    ...raw,
    instances: dedupeRawInstances(raw.instances, sourceLabel),
  };
}

function deepMerge(templateValue: unknown, sourceValue: unknown): unknown {
  if (Array.isArray(templateValue)) {
    return Array.isArray(sourceValue) ? cloneValue(sourceValue) : cloneValue(templateValue);
  }

  if (isPlainObject(templateValue)) {
    const result: Record<string, unknown> = {};
    const sourceObject = isPlainObject(sourceValue) ? sourceValue : {};

    for (const key of Object.keys(templateValue)) {
      result[key] = deepMerge(templateValue[key], sourceObject[key]);
    }

    for (const [key, value] of Object.entries(sourceObject)) {
      if (!(key in result)) {
        result[key] = cloneValue(value);
      }
    }

    return result;
  }

  if (sourceValue === undefined) {
    return templateValue;
  }

  return cloneValue(sourceValue);
}

function mergeRawConfig(templateConfig: RawInstanceConfig, sourceConfig: RawInstanceConfig): RawInstanceConfig {
  const merged = deepMerge(templateConfig, sourceConfig) as RawInstanceConfig;
  const templateInstances = Array.isArray(templateConfig.instances) ? templateConfig.instances : [];
  const sourceInstances = Array.isArray(sourceConfig.instances) ? sourceConfig.instances : [];
  const mergedInstances: NonNullable<RawInstanceConfig["instances"]> = [];

  for (const templateInstance of templateInstances) {
    const matchingSourceInstance = sourceInstances.find((instance) => instance?.id === templateInstance?.id);
    mergedInstances.push(deepMerge(templateInstance, matchingSourceInstance) as NonNullable<RawInstanceConfig["instances"]>[number]);
  }

  for (const sourceInstance of sourceInstances) {
    if (!templateInstances.some((instance) => instance?.id === sourceInstance?.id)) {
      mergedInstances.push(cloneValue(sourceInstance));
    }
  }

  merged.instances = mergedInstances;

  if (templateConfig.version !== undefined) {
    merged.version = templateConfig.version;
  }

  const mergedSelectedInstance = merged.defaults?.selected_instance;
  if (!mergedInstances.some((instance) => instance?.id === mergedSelectedInstance) && mergedInstances.length > 0) {
    merged.defaults = {
      ...(merged.defaults ?? {}),
      selected_instance: mergedInstances[0].id,
    };
  }

  return merged;
}

function buildFallbackRequestDefaults(): PypnmRequestDefaults {
  return {
    cableModemMacAddress: "",
    cableModemIpAddress: "",
    tftpIpv4: "",
    tftpIpv6: "",
    channelIds: "0",
    snmpRwCommunity: "private",
  };
}

function normalizeRequestDefaults(raw?: RawRequestDefaults): PypnmRequestDefaults {
  const fallback = buildFallbackRequestDefaults();
  const rawChannelIds = raw?.capture?.channel_ids;
  const normalizedChannelIds = Array.isArray(rawChannelIds)
    ? (rawChannelIds.length === 0 ? "0" : rawChannelIds.join(","))
    : (typeof rawChannelIds === "string" && rawChannelIds.trim() !== "" ? rawChannelIds : fallback.channelIds);

  return {
    cableModemMacAddress: raw?.cable_modem?.mac_address ?? fallback.cableModemMacAddress,
    cableModemIpAddress: raw?.cable_modem?.ip_address ?? fallback.cableModemIpAddress,
    tftpIpv4: raw?.tftp?.ipv4 ?? fallback.tftpIpv4,
    tftpIpv6: raw?.tftp?.ipv6 ?? fallback.tftpIpv6,
    channelIds: normalizedChannelIds,
    snmpRwCommunity: raw?.snmp?.rw_community ?? fallback.snmpRwCommunity,
  };
}

function buildFallbackConfig(): PypnmInstanceConfig {
  return {
    version: 1,
    defaults: {
      selectedInstance: "default",
      pollIntervalMs: 5000,
      requestTimeoutMs: env.requestTimeoutMs,
      healthPath: "/health",
      logging: {
        level: "INFO",
      },
    },
    instances: [
      {
        id: "default",
        label: "Default",
        baseUrl: env.apiBaseUrl,
        enabled: true,
        tags: ["env"],
        capabilities: ["health", "analysis"],
        polling: {
          enabled: true,
          intervalMs: 5000,
        },
        requestDefaults: buildFallbackRequestDefaults(),
      },
    ],
  };
}

function normalizeConfig(raw: RawInstanceConfig): PypnmInstanceConfig {
  const fallback = buildFallbackConfig();

  const instances = (raw.instances ?? [])
    .filter((instance): instance is NonNullable<RawInstanceConfig["instances"]>[number] => Boolean(instance?.id && instance?.label && instance?.base_url))
    .map<PypnmInstance>((instance) => ({
      id: instance.id ?? "unknown",
      label: instance.label ?? instance.id ?? "Unknown",
      baseUrl: instance.base_url ?? fallback.instances[0].baseUrl,
      enabled: instance.enabled ?? true,
      tags: instance.tags ?? [],
      capabilities: instance.capabilities ?? [],
      polling: {
        enabled: instance.polling?.enabled ?? true,
        intervalMs: instance.polling?.interval_ms ?? raw.defaults?.poll_interval_ms ?? fallback.defaults.pollIntervalMs,
      },
      requestDefaults: normalizeRequestDefaults(instance.request_defaults),
    }));

  if (instances.length === 0) {
    return fallback;
  }

  return {
    version: raw.version ?? 1,
    defaults: {
      selectedInstance: raw.defaults?.selected_instance ?? instances[0].id,
      pollIntervalMs: raw.defaults?.poll_interval_ms ?? fallback.defaults.pollIntervalMs,
      requestTimeoutMs: raw.defaults?.request_timeout_ms ?? fallback.defaults.requestTimeoutMs,
      healthPath: raw.defaults?.health_path ?? fallback.defaults.healthPath,
      logging: {
        level: normalizeLogLevel(raw.defaults?.logging?.level ?? fallback.defaults.logging.level),
      },
    },
    instances,
  };
}

export async function loadInstanceConfig(): Promise<PypnmInstanceConfig> {
  let templateConfig: RawInstanceConfig | null = null;
  let localOverrideConfig: RawInstanceConfig | null = null;

  try {
    const response = await fetch(TEMPLATE_CONFIG_URL, { cache: "no-store" });
    if (response.ok) {
      templateConfig = sanitizeRawConfig(((parse(await response.text()) as RawInstanceConfig) ?? {}), TEMPLATE_CONFIG_URL);
    }
  } catch {
    templateConfig = null;
  }

  try {
    const response = await fetch(LOCAL_OVERRIDE_CONFIG_URL, { cache: "no-store" });
    if (response.ok) {
      localOverrideConfig = sanitizeRawConfig(((parse(await response.text()) as RawInstanceConfig) ?? {}), LOCAL_OVERRIDE_CONFIG_URL);
    }
  } catch {
    localOverrideConfig = null;
  }

  if (templateConfig && localOverrideConfig) {
    return normalizeConfig(mergeRawConfig(templateConfig, localOverrideConfig));
  }

  if (templateConfig) {
    return normalizeConfig(templateConfig);
  }

  if (localOverrideConfig) {
    return normalizeConfig(localOverrideConfig);
  }

  return buildFallbackConfig();
}

export function readStoredInstanceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}

export function storeSelectedInstanceId(instanceId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, instanceId);
}

export { mergeRawConfig };
export { sanitizeRawConfig };
