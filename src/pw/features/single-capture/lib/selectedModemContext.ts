const SELECTED_MODEM_CONTEXT_KEY = "pcw:selected-modem-context";
const SELECTED_MODEM_IP_CACHE_KEY = "pcw:selected-modem-ip-cache";

export interface SelectedModemContext {
  sgId: number;
  macAddress: string;
  ipAddress: string;
  snmpCommunity: string;
  channelIds: number[];
  selectedAtEpochMs: number;
}

export function saveSelectedModemContext(context: SelectedModemContext): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalizedMac = String(context.macAddress ?? "").trim().toLowerCase();
  const normalizedIp = String(context.ipAddress ?? "").trim();
  const resolvedIp = normalizedIp && normalizedIp.toLowerCase() !== "n/a"
    ? normalizedIp
    : (readSelectedModemIpByMac(normalizedMac) ?? "n/a");
  window.localStorage.setItem(SELECTED_MODEM_CONTEXT_KEY, JSON.stringify({
    ...context,
    macAddress: normalizedMac || context.macAddress,
    ipAddress: resolvedIp,
  }));
}

export function readSelectedModemContext(): SelectedModemContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SELECTED_MODEM_CONTEXT_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SelectedModemContext>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (typeof parsed.macAddress !== "string" || !parsed.macAddress.trim()) {
      return null;
    }
    const macAddress = parsed.macAddress.trim().toLowerCase();
    const parsedIpAddress = typeof parsed.ipAddress === "string" && parsed.ipAddress.trim()
      ? parsed.ipAddress.trim()
      : "n/a";
    const resolvedIpAddress = parsedIpAddress.toLowerCase() !== "n/a"
      ? parsedIpAddress
      : (readSelectedModemIpByMac(macAddress) ?? "n/a");

    return {
      sgId: typeof parsed.sgId === "number" ? parsed.sgId : -1,
      macAddress,
      ipAddress: resolvedIpAddress,
      snmpCommunity: typeof parsed.snmpCommunity === "string" && parsed.snmpCommunity.trim()
        ? parsed.snmpCommunity.trim()
        : "private",
      channelIds: Array.isArray(parsed.channelIds)
        ? parsed.channelIds
          .map((item) => (typeof item === "number" ? item : Number.parseInt(String(item), 10)))
          .filter((item) => Number.isInteger(item) && item >= 0)
        : [],
      selectedAtEpochMs: typeof parsed.selectedAtEpochMs === "number" ? parsed.selectedAtEpochMs : 0,
    };
  } catch {
    return null;
  }
}

export function updateSelectedModemIpCache(entries: Array<{ macAddress: string; ipAddress: string }>): void {
  if (typeof window === "undefined" || entries.length === 0) {
    return;
  }
  const current = readSelectedModemIpCache();
  const next = { ...current };
  for (const entry of entries) {
    const mac = String(entry.macAddress ?? "").trim().toLowerCase();
    const ip = String(entry.ipAddress ?? "").trim();
    if (!mac || !ip || ip.toLowerCase() === "n/a") {
      continue;
    }
    next[mac] = ip;
  }
  window.localStorage.setItem(SELECTED_MODEM_IP_CACHE_KEY, JSON.stringify(next));
}

export function readSelectedModemIpCache(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(SELECTED_MODEM_IP_CACHE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, value]) => [key.trim().toLowerCase(), String(value ?? "").trim()])
        .filter(([key, value]) => key.length > 0 && value.length > 0),
    );
  } catch {
    return {};
  }
}

export function readSelectedModemIpByMac(macAddress: string): string | null {
  const mac = String(macAddress ?? "").trim().toLowerCase();
  if (!mac) {
    return null;
  }
  const cache = readSelectedModemIpCache();
  const value = cache[mac];
  return value && value.toLowerCase() !== "n/a" ? value : null;
}
