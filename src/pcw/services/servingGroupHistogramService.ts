import { CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH } from "@/pcw/services/apiPaths";
import type { ServingGroupCaptureRequestPayload } from "@/pcw/features/serving-group/lib/captureRequestTypes";
import {
  cancelServingGroupOperation,
  getServingGroupOperationResults,
  getServingGroupOperationStatus,
  startServingGroupOperation,
} from "@/pcw/services/servingGroupOperationService";

export async function startServingGroupHistogramCapture(
  baseUrl: string,
  payload: ServingGroupCaptureRequestPayload,
): Promise<unknown> {
  return startServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH, payload);
}

export async function getServingGroupHistogramCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationStatus(baseUrl, CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH, operationId);
}

export async function cancelServingGroupHistogramCapture(baseUrl: string, operationId: string): Promise<unknown> {
  return cancelServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH, operationId);
}

export async function getServingGroupHistogramResults(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationResults(baseUrl, CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH, operationId);
}
