import { CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH } from "@/pcw/services/apiPaths";
import type { ServingGroupCaptureRequestPayload } from "@/pcw/features/serving-group/lib/captureRequestTypes";
import {
  cancelServingGroupOperation,
  getServingGroupOperationResults,
  getServingGroupOperationStatus,
  startServingGroupOperation,
} from "@/pcw/services/servingGroupOperationService";

export async function startServingGroupFecSummaryCapture(
  baseUrl: string,
  payload: ServingGroupCaptureRequestPayload,
): Promise<unknown> {
  return startServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH, payload);
}

export async function getServingGroupFecSummaryCaptureStatus(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationStatus(baseUrl, CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH, operationId);
}

export async function cancelServingGroupFecSummaryCapture(baseUrl: string, operationId: string): Promise<unknown> {
  return cancelServingGroupOperation(baseUrl, CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH, operationId);
}

export async function getServingGroupFecSummaryResults(baseUrl: string, operationId: string): Promise<unknown> {
  return getServingGroupOperationResults(baseUrl, CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH, operationId);
}
