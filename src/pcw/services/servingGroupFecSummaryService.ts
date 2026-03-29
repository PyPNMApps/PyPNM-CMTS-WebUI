import { ADVANCED_OPERATION_START_TIMEOUT_MS, ADVANCED_OPERATION_STATUS_TIMEOUT_MS } from "@/lib/constants";
import { requestWithBaseUrl } from "@/services/http";
import type { ServingGroupRxMerStartCaptureRequest } from "@/pcw/services/servingGroupRxMerService";

const SERVING_GROUP_FEC_SUMMARY_BASE = "/cmts/pnm/sg/ds/ofdm/fecSummary";

export async function startServingGroupFecSummaryCapture(
  baseUrl: string,
  payload: ServingGroupRxMerStartCaptureRequest,
): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_FEC_SUMMARY_BASE}/startCapture`,
    data: payload,
    timeout: ADVANCED_OPERATION_START_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupFecSummaryCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_FEC_SUMMARY_BASE}/status`,
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function cancelServingGroupFecSummaryCapture(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_FEC_SUMMARY_BASE}/cancel`,
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupFecSummaryResults(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_FEC_SUMMARY_BASE}/results`,
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}
