import { requestWithBaseUrl } from "@/services/http";
import { toPwApiPath } from "@/lib/pwCompat";
import {
  ADVANCED_OPERATION_ANALYSIS_TIMEOUT_MS,
  ADVANCED_OPERATION_START_TIMEOUT_MS,
  ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
} from "@/lib/constants";
import type {
  AdvancedMultiChanEstAnalysisRequest,
  AdvancedMultiChanEstAnalysisResponse,
  AdvancedMultiChanEstRequest,
  AdvancedMultiChanEstStartResponse,
  AdvancedMultiChanEstStatusResponse,
} from "@/types/api";

const ADVANCED_CHANNEL_ESTIMATION_BASE = "/advance/multi/ds/channelEstimation";

export async function startAdvancedChannelEstimation(baseUrl: string, payload: AdvancedMultiChanEstRequest): Promise<AdvancedMultiChanEstStartResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiChanEstStartResponse>(baseUrl, {
    method: "POST",
    url: toPwApiPath(`${ADVANCED_CHANNEL_ESTIMATION_BASE}/start`),
    data: payload,
    timeout: ADVANCED_OPERATION_START_TIMEOUT_MS,
  });
  return response.data;
}

export async function getAdvancedChannelEstimationStatus(baseUrl: string, operationId: string): Promise<AdvancedMultiChanEstStatusResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiChanEstStatusResponse>(baseUrl, {
    method: "GET",
    url: toPwApiPath(`${ADVANCED_CHANNEL_ESTIMATION_BASE}/status/${operationId}`),
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function stopAdvancedChannelEstimation(baseUrl: string, operationId: string): Promise<AdvancedMultiChanEstStatusResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiChanEstStatusResponse>(baseUrl, {
    method: "DELETE",
    url: toPwApiPath(`${ADVANCED_CHANNEL_ESTIMATION_BASE}/stop/${operationId}`),
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function analyzeAdvancedChannelEstimation(baseUrl: string, payload: AdvancedMultiChanEstAnalysisRequest): Promise<AdvancedMultiChanEstAnalysisResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiChanEstAnalysisResponse>(baseUrl, {
    method: "POST",
    url: toPwApiPath(`${ADVANCED_CHANNEL_ESTIMATION_BASE}/analysis`),
    data: payload,
    timeout: ADVANCED_OPERATION_ANALYSIS_TIMEOUT_MS,
  });
  return response.data;
}

export function getAdvancedChannelEstimationResultsZipUrl(baseUrl: string, operationId: string): string {
  return new URL(toPwApiPath(`${ADVANCED_CHANNEL_ESTIMATION_BASE}/results/${operationId}`), baseUrl).toString();
}
