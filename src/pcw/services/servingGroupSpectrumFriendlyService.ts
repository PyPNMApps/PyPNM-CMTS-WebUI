import { CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH } from "@/pcw/services/apiPaths";
import type { ServingGroupCaptureRequestPayload } from "@/pcw/features/serving-group/lib/captureRequestTypes";
import {
  cancelServingGroupOperation,
  getServingGroupOperationResults,
  getServingGroupOperationStatus,
  startServingGroupOperation,
} from "@/pcw/services/servingGroupOperationService";

export async function startServingGroupSpectrumFriendlyCapture(
  baseUrl: string,
  payload: ServingGroupCaptureRequestPayload,
): Promise<unknown> {
  return startServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, payload);
}

export async function getServingGroupSpectrumFriendlyCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationStatus(baseUrl, CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, operationId);
}

export async function cancelServingGroupSpectrumFriendlyCapture(baseUrl: string, operationId: string): Promise<unknown> {
  return cancelServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, operationId);
}

export async function getServingGroupSpectrumFriendlyResults(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationResults(baseUrl, CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, operationId);
}
