import { ADVANCED_OPERATION_START_TIMEOUT_MS, ADVANCED_OPERATION_STATUS_TIMEOUT_MS } from "@/lib/constants";
import { requestWithBaseUrl } from "@/services/http";
import type { ServingGroupCaptureRequestPayload } from "@/features/serving-group/components/ServingGroupCaptureRequestForm";

const SERVING_GROUP_SPECTRUM_FRIENDLY_BASE = "/cmts/pnm/sg/spectrumAnalyzer";

export async function startServingGroupSpectrumFriendlyCapture(
  baseUrl: string,
  payload: ServingGroupCaptureRequestPayload,
): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_SPECTRUM_FRIENDLY_BASE}/startCapture`,
    data: payload,
    timeout: ADVANCED_OPERATION_START_TIMEOUT_MS,
  });
  return response.data;
}

export async function getServingGroupSpectrumFriendlyCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: `${SERVING_GROUP_SPECTRUM_FRIENDLY_BASE}/status`,
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
    url: `${SERVING_GROUP_SPECTRUM_FRIENDLY_BASE}/cancel`,
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
    url: `${SERVING_GROUP_SPECTRUM_FRIENDLY_BASE}/results`,
    data: {
      pnm_capture_operation_id: operationId,
    },
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

