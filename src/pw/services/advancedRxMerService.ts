import { requestWithBaseUrl } from "@/services/http";
import { toPwApiPath } from "@/lib/pwCompat";
import type {
  AdvancedMultiRxMerAnalysisRequest,
  AdvancedMultiRxMerAnalysisResponse,
  AdvancedMultiRxMerRequest,
  AdvancedMultiRxMerStartResponse,
  AdvancedMultiRxMerStatusResponse,
} from "@/types/api";

const ADVANCED_RXMER_BASE = "/advance/multi/ds/rxMer";

export async function startAdvancedRxMer(baseUrl: string, payload: AdvancedMultiRxMerRequest): Promise<AdvancedMultiRxMerStartResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiRxMerStartResponse>(baseUrl, {
    method: "POST",
    url: toPwApiPath(`${ADVANCED_RXMER_BASE}/start`),
    data: payload,
    timeout: 120000,
  });
  return response.data;
}

export async function getAdvancedRxMerStatus(baseUrl: string, operationId: string): Promise<AdvancedMultiRxMerStatusResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiRxMerStatusResponse>(baseUrl, {
    method: "GET",
    url: toPwApiPath(`${ADVANCED_RXMER_BASE}/status/${operationId}`),
    timeout: 30000,
  });
  return response.data;
}

export async function stopAdvancedRxMer(baseUrl: string, operationId: string): Promise<AdvancedMultiRxMerStatusResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiRxMerStatusResponse>(baseUrl, {
    method: "DELETE",
    url: toPwApiPath(`${ADVANCED_RXMER_BASE}/stop/${operationId}`),
    timeout: 30000,
  });
  return response.data;
}

export async function analyzeAdvancedRxMer(baseUrl: string, payload: AdvancedMultiRxMerAnalysisRequest): Promise<AdvancedMultiRxMerAnalysisResponse> {
  const response = await requestWithBaseUrl<AdvancedMultiRxMerAnalysisResponse>(baseUrl, {
    method: "POST",
    url: toPwApiPath(`${ADVANCED_RXMER_BASE}/analysis`),
    data: payload,
    timeout: 120000,
  });
  return response.data;
}

export function getAdvancedRxMerResultsZipUrl(baseUrl: string, operationId: string): string {
  return new URL(toPwApiPath(`${ADVANCED_RXMER_BASE}/results/${operationId}`), baseUrl).toString();
}
