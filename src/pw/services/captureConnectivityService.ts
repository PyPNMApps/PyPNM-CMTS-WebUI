import { requestWithBaseUrl } from "@/services/http";
import type { CaptureConnectivityInputs } from "@/pw/features/operations/captureConnectivity";
import { toPwApiPath } from "@/lib/pwCompat";

interface SysDescrCheckResponse {
  status?: number | string;
  message?: string;
  device?: {
    mac_address?: string;
  };
  results?: {
    sysDescr?: string;
  };
}

function isSuccessfulConnectivityStatus(status: number | string | undefined): boolean {
  if (typeof status === "number") {
    return status === 0;
  }

  const normalized = String(status ?? "").trim().toLowerCase();
  return normalized === "0" || normalized === "success";
}

function normalizeMacForCompare(value: string | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-f]/g, "");
}

export async function checkCaptureInputsOnline(baseUrl: string, inputs: CaptureConnectivityInputs): Promise<boolean> {
  const response = await requestWithBaseUrl<SysDescrCheckResponse>(baseUrl, {
    method: "POST",
    url: toPwApiPath("/system/sysDescr"),
    data: {
      cable_modem: {
        mac_address: inputs.macAddress,
        ip_address: inputs.ipAddress,
        snmp: {
          snmpV2C: {
            community: inputs.community,
          },
        },
      },
    },
    timeout: 10_000,
  });

  if (!isSuccessfulConnectivityStatus(response.data?.status)) {
    return false;
  }

  const requestedMac = normalizeMacForCompare(inputs.macAddress);
  const resolvedMac = normalizeMacForCompare(response.data?.device?.mac_address);

  if (requestedMac !== "" && resolvedMac !== "" && requestedMac !== resolvedMac) {
    return false;
  }

  return true;
}
