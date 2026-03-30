import { ADVANCED_OPERATION_START_TIMEOUT_MS, ADVANCED_OPERATION_STATUS_TIMEOUT_MS } from "@/lib/constants";
import { requestWithBaseUrl } from "@/services/http";
import type { ServingGroupCaptureRequestPayload } from "@/pcw/features/serving-group/components/ServingGroupCaptureRequestForm";
import { buildOperationActionPath, CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH } from "@/pcw/services/apiPaths";

export async function startServingGroupSpectrumFriendlyCapture(
  baseUrl: string,
  payload: ServingGroupCaptureRequestPayload,
): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, "startCapture"),
    data: payload,
    timeout: ADVANCED_OPERATION_START_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupSpectrumFriendlyCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, "status"),
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function cancelServingGroupSpectrumFriendlyCapture(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, "cancel"),
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupSpectrumFriendlyResults(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, "results"),
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}
