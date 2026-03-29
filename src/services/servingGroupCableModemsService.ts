import { requestWithBaseUrl } from "@/services/http";

export type ServingGroupCableModemRefreshMode = "light" | "heavy";

interface ServingGroupCableModemItem {
  mac_address?: string;
  ip_address?: string;
  channel_ids?: unknown;
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

function normalizeCableModemRows(response: ServingGroupCableModemResponse): ServingGroupCableModemRow[] {
  const rows: ServingGroupCableModemRow[] = [];
  for (const group of response.groups ?? []) {
    const sgId = typeof group.sg_id === "number" && Number.isInteger(group.sg_id) ? group.sg_id : -1;
    for (const item of group.items ?? []) {
      const macAddress = String(item.mac_address ?? "").trim().toLowerCase();
      if (!macAddress) {
        continue;
      }
      rows.push({
        key: `${sgId}-${macAddress}`,
        sgId,
        macAddress,
        ipAddress: String(item.ip_address ?? "").trim() || "n/a",
        channelIds: asNumberArray(item.channel_ids),
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

