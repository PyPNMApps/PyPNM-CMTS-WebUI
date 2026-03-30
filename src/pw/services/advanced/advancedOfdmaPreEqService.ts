import { requestWithBaseUrl } from "@/services/http";
import { toPwApiPath } from "@/lib/pwCompat";
import {
  ADVANCED_OFDMA_PRE_EQ_ANALYSIS_TIMEOUT_MS,
  ADVANCED_OPERATION_START_TIMEOUT_MS,
  ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
} from "@/lib/constants";
import type {
  AdvancedMultiUsOfdmaPreEqAnalysisRequest,
  AdvancedMultiUsOfdmaPreEqAnalysisResponse,
  AdvancedMultiUsOfdmaPreEqRequest,
  AdvancedMultiUsOfdmaPreEqStartResponse,
  AdvancedMultiUsOfdmaPreEqStatusResponse,
} from "@/types/api";

const ADVANCED_OFDMA_PRE_EQ_BASE = "/advance/multi/us/ofdmaPreEqualization";

export async function startAdvancedOfdmaPreEq(baseUrl: string, payload: AdvancedMultiUsOfdmaPreEqRequest): Promise<AdvancedMultiUsOfdmaPreEqStartResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiUsOfdmaPreEqStartResponse>(baseUrl, {
    method: "POST",
    url: toPwApiPath(`${ADVANCED_OFDMA_PRE_EQ_BASE}/start`),
    data: payload,
    timeout: ADVANCED_OPERATION_START_TIMEOUT_MS,
  });
  return response.data;
}

export async function getAdvancedOfdmaPreEqStatus(baseUrl: string, operationId: string): Promise<AdvancedMultiUsOfdmaPreEqStatusResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiUsOfdmaPreEqStatusResponse>(baseUrl, {
    method: "GET",
    url: toPwApiPath(`${ADVANCED_OFDMA_PRE_EQ_BASE}/status/${operationId}`),
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function stopAdvancedOfdmaPreEq(baseUrl: string, operationId: string): Promise<AdvancedMultiUsOfdmaPreEqStatusResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiUsOfdmaPreEqStatusResponse>(baseUrl, {
    method: "DELETE",
    url: toPwApiPath(`${ADVANCED_OFDMA_PRE_EQ_BASE}/stop/${operationId}`),
    timeout: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  });
  return response.data;
}

export async function analyzeAdvancedOfdmaPreEq(baseUrl: string, payload: AdvancedMultiUsOfdmaPreEqAnalysisRequest): Promise<AdvancedMultiUsOfdmaPreEqAnalysisResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiUsOfdmaPreEqAnalysisResponse>(baseUrl, {
    method: "POST",
    url: toPwApiPath(`${ADVANCED_OFDMA_PRE_EQ_BASE}/analysis`),
    data: payload,
    timeout: ADVANCED_OFDMA_PRE_EQ_ANALYSIS_TIMEOUT_MS,
  });
  return response.data;
}

export function getAdvancedOfdmaPreEqResultsZipUrl(baseUrl: string, operationId: string): string {
  return new URL(toPwApiPath(`${ADVANCED_OFDMA_PRE_EQ_BASE}/results/${operationId}`), baseUrl).toString();
}
