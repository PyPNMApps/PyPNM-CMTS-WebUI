import { ADVANCED_OPERATION_START_TIMEOUT_MS, ADVANCED_OPERATION_STATUS_TIMEOUT_MS } from "@/lib/constants";
import { requestWithBaseUrl } from "@/services/http";
import type { ServingGroupRxMerStartCaptureRequest } from "@/services/servingGroupRxMerService";

const SERVING_GROUP_CHANNEL_EST_COEFF_BASE = "/cmts/pnm/sg/ds/ofdm/channelEstCoeff";

export async function startServingGroupChannelEstCoeffCapture(
  baseUrl: string,
  payload: ServingGroupRxMerStartCaptureRequest,
): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_CHANNEL_EST_COEFF_BASE}/startCapture`,
    data: payload,
    timeout: ADVANCED_OPERATION_START_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupChannelEstCoeffCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_CHANNEL_EST_COEFF_BASE}/status`,
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function cancelServingGroupChannelEstCoeffCapture(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_CHANNEL_EST_COEFF_BASE}/cancel`,
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupChannelEstCoeffResults(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_CHANNEL_EST_COEFF_BASE}/results`,
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

