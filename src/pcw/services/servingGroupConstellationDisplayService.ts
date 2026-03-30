import { ADVANCED_OPERATION_START_TIMEOUT_MS, ADVANCED_OPERATION_STATUS_TIMEOUT_MS } from "@/lib/constants";
import { requestWithBaseUrl } from "@/services/http";
import type { ServingGroupRxMerStartCaptureRequest } from "@/pcw/services/servingGroupRxMerService";
import { buildOperationActionPath, CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH } from "@/pcw/services/apiPaths";

export async function startServingGroupConstellationDisplayCapture(
  baseUrl: string,
  payload: ServingGroupRxMerStartCaptureRequest,
): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, "startCapture"),
    data: payload,
    timeout: ADVANCED_OPERATION_START_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupConstellationDisplayCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, "status"),
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function cancelServingGroupConstellationDisplayCapture(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, "cancel"),
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupConstellationDisplayResults(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, "results"),
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}
