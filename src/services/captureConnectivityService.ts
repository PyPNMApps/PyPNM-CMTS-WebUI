import { requestWithBaseUrl } from "@/services/http";
import type { CaptureConnectivityInputs } from "@/features/operations/captureConnectivity";
import { toPwApiPath } from "@/lib/pwCompat";

interface SysDescrCheckResponse {
  status?: number | string;
  message?: string;
  results?: {
    sysDescr?: string;
  };
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

  return Number(response.data?.status) === 0;
}
