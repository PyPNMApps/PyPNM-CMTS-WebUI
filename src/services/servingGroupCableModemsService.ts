import { requestWithBaseUrl } from "@/services/http";

export type ServingGroupCableModemRefreshMode = "light" | "heavy";

interface ServingGroupCableModemItem {
  mac_address?: string;
  ip_address?: string;
  ipAddress?: string;
  ipv4?: string;
  ipv6?: string;
  channel_ids?: unknown;
  ds_channel_ids?: unknown;
  us_channel_ids?: unknown;
  sysdescr?: {
    VENDOR?: string;
    MODEL?: string;
    SW_REV?: string;
  };
  registration_status?: {
    status?: number;
    text?: string;
  };
}

interface ServingGroupCableModemGroup {
  sg_id?: number;
  items?: ServingGroupCableModemItem[];
}

interface ServingGroupCableModemResponse {
  groups?: ServingGroupCableModemGroup[];
}

export interface ServingGroupCableModemRow {
  key: string;
  sgId: number;
  macAddress: string;
  ipAddress: string;
  dsChannelIds: number[];
  usChannelIds: number[];
  channelIds: number[];
  registrationStatusCode: number | null;
  registrationStatusText: string;
  vendor: string;
  model: string;
  softwareVersion: string;
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "number" ? item : Number.parseInt(String(item), 10)))
    .filter((item) => Number.isInteger(item) && item >= 0);
}

function dedupeNumbers(values: number[]): number[] {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

function normalizeCableModemRows(response: ServingGroupCableModemResponse): ServingGroupCableModemRow[] {
  const rows: ServingGroupCableModemRow[] = [];
  for (const group of response.groups ?? []) {
    const sgId = typeof group.sg_id === "number" && Number.isInteger(group.sg_id) ? group.sg_id : -1;
    for (const item of group.items ?? []) {
      const macAddress = String(item.mac_address ?? "").trim().toLowerCase();
      if (!macAddress) {
        continue;
      }
      const dsChannelIds = asNumberArray(item.ds_channel_ids);
      const usChannelIds = asNumberArray(item.us_channel_ids);
      const legacyChannelIds = asNumberArray(item.channel_ids);
      const normalizedDsChannelIds = dedupeNumbers(dsChannelIds);
      const normalizedUsChannelIds = dedupeNumbers(usChannelIds);
      const channelIds = dedupeNumbers([
        ...normalizedDsChannelIds,
        ...normalizedUsChannelIds,
        ...legacyChannelIds,
      ]);
      const normalizedIpAddress = String(
        item.ip_address
        ?? item.ipAddress
        ?? item.ipv4
        ?? item.ipv6
        ?? "",
      ).trim();
      rows.push({
        key: `${sgId}-${macAddress}`,
        sgId,
        macAddress,
        ipAddress: normalizedIpAddress || "n/a",
        dsChannelIds: normalizedDsChannelIds,
        usChannelIds: normalizedUsChannelIds,
        channelIds,
        registrationStatusCode: typeof item.registration_status?.status === "number" ? item.registration_status.status : null,
        registrationStatusText: String(item.registration_status?.text ?? "").trim() || "n/a",
        vendor: String(item.sysdescr?.VENDOR ?? "").trim() || "n/a",
        model: String(item.sysdescr?.MODEL ?? "").trim() || "n/a",
        softwareVersion: String(item.sysdescr?.SW_REV ?? "").trim() || "n/a",
      });
    }
  }
  return rows.sort((left, right) => {
    const bySg = left.sgId - right.sgId;
    if (bySg !== 0) {
      return bySg;
    }
    return left.macAddress.localeCompare(right.macAddress);
  });
}

export async function getServingGroupCableModems(
  baseUrl: string,
  servingGroupIds: number[],
  refreshMode: ServingGroupCableModemRefreshMode,
): Promise<ServingGroupCableModemRow[]> {
  const response = await requestWithBaseUrl<ServingGroupCableModemResponse>(baseUrl, {
    method: "POST",
    url: "/cmts/servingGroup/operations/get/cableModems",
    data: {
      cmts: {
        serving_group: {
          id: servingGroupIds,
        },
      },
      refresh: {
        mode: refreshMode,
        wait_for_cache: refreshMode === "heavy",
        timeout_seconds: refreshMode === "heavy" ? 20 : 8,
      },
    },
  });
  return normalizeCableModemRows(response.data);
}
