import { ADVANCED_OPERATION_START_TIMEOUT_MS, ADVANCED_OPERATION_STATUS_TIMEOUT_MS } from "@/lib/constants";
import { requestWithBaseUrl } from "@/services/http";
import { buildOperationActionPath, CMTS_SERVING_GROUP_RXMER_BASE_PATH } from "@/pcw/services/apiPaths";

export interface ServingGroupRxMerStartCaptureRequest {
  cmts: {
    serving_group: {
      id: number[];
    };
    cable_modem: {
      mac_address: string[];
      pnm_parameters: {
        tftp: {
          ipv4: string;
          ipv6: string;
        };
        capture: {
          channel_ids: number[];
        };
      };
      snmp: {
        snmpV2C: {
          community: string;
        };
      };
    };
  };
  execution: {
    max_workers: number;
    retry_count: number;
    retry_delay_seconds: number;
    per_modem_timeout_seconds: number;
    overall_timeout_seconds: number;
  };
}

export async function startServingGroupRxMerCapture(baseUrl: string, payload: ServingGroupRxMerStartCaptureRequest): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_RXMER_BASE_PATH, "startCapture"),
    data: payload,
    timeout: ADVANCED_OPERATION_START_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupRxMerCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_RXMER_BASE_PATH, "status"),
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function cancelServingGroupRxMerCapture(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_RXMER_BASE_PATH, "cancel"),
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupRxMerResults(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_RXMER_BASE_PATH, "results"),
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}
