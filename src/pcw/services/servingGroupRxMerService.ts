import { CMTS_SERVING_GROUP_RXMER_BASE_PATH } from "@/pcw/services/apiPaths";
import type { ServingGroupCaptureRequestPayload } from "@/pcw/features/serving-group/lib/captureRequestTypes";
import {
  cancelServingGroupOperation,
  getServingGroupOperationResults,
  getServingGroupOperationStatus,
  startServingGroupOperation,
} from "@/pcw/services/servingGroupOperationService";

export function startServingGroupRxMerCapture(baseUrl: string, payload: ServingGroupCaptureRequestPayload): Promise<unknown> {
  return startServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_RXMER_BASE_PATH, payload);
}

export function getServingGroupRxMerCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationStatus(baseUrl, CMTS_SERVING_GROUP_RXMER_BASE_PATH, operationId);
}

export function cancelServingGroupRxMerCapture(baseUrl: string, operationId: string): Promise<unknown> {
  return cancelServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_RXMER_BASE_PATH, operationId);
}

export function getServingGroupRxMerResults(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationResults(baseUrl, CMTS_SERVING_GROUP_RXMER_BASE_PATH, operationId);
}
