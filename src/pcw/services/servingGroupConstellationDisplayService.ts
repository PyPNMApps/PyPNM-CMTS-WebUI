import { CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH } from "@/pcw/services/apiPaths";
import type { ServingGroupCaptureRequestPayload } from "@/pcw/features/serving-group/lib/captureRequestTypes";
import {
  cancelServingGroupOperation,
  getServingGroupOperationResults,
  getServingGroupOperationStatus,
  startServingGroupOperation,
} from "@/pcw/services/servingGroupOperationService";

export async function startServingGroupConstellationDisplayCapture(
  baseUrl: string,
  payload: ServingGroupCaptureRequestPayload,
): Promise<unknown> {
  return startServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, payload);
}

export async function getServingGroupConstellationDisplayCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationStatus(baseUrl, CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, operationId);
}

export async function cancelServingGroupConstellationDisplayCapture(baseUrl: string, operationId: string): Promise<unknown> {
  return cancelServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, operationId);
}

export async function getServingGroupConstellationDisplayResults(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationResults(baseUrl, CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, operationId);
}
