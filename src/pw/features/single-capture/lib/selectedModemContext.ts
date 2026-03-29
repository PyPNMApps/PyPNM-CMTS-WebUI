const SELECTED_MODEM_CONTEXT_KEY = "pcw:selected-modem-context";

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
  window.localStorage.setItem(SELECTED_MODEM_CONTEXT_KEY, JSON.stringify(context));
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
    return {
      sgId: typeof parsed.sgId === "number" ? parsed.sgId : -1,
      macAddress: parsed.macAddress.trim().toLowerCase(),
      ipAddress: typeof parsed.ipAddress === "string" && parsed.ipAddress.trim() ? parsed.ipAddress.trim() : "n/a",
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

