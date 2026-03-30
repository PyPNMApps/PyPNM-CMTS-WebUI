import { requestWithBaseUrl } from "@/services/http";
import type { HealthResponse } from "@/types/api";
import {
  PRODUCT_PROFILE_PCW,
  resolveProductProfileWithFallback,
} from "@/app/productProfile";

const DEFAULT_HEALTH_TIMEOUT_MS = 4000;
const DEFAULT_RELOAD_TIMEOUT_MS = 15000;

export function classifyHealthError(error: Error): { status: string; message: string } {
  const message = error.message.trim();
  const lowered = message.toLowerCase();

  if (lowered.includes("timeout") || lowered.includes("network error") || lowered.includes("failed to fetch")) {
    return {
      status: "unreachable",
      message: message || "Timed out before the agent responded",
    };
  }

  return {
    status: "error",
    message: message || "Health request failed",
  };
}

export async function getHealth(
  baseUrl: string,
  healthPath = "/health",
  timeoutMs = DEFAULT_HEALTH_TIMEOUT_MS,
): Promise<HealthResponse> {
  const response = await requestWithBaseUrl<HealthResponse>(baseUrl, {
    method: "GET",
    timeout: timeoutMs,
    url: healthPath,
  });

  return response.data;
}

export async function reloadWebService(
  baseUrl: string,
  reloadPath = resolveProductProfileWithFallback() === PRODUCT_PROFILE_PCW
    ? "/cmts/system/webService/reload"
    : "/pypnm/system/webService/reload",
  timeoutMs = DEFAULT_RELOAD_TIMEOUT_MS,
): Promise<void> {
  await requestWithBaseUrl(baseUrl, {
    method: "POST",
    timeout: timeoutMs,
    url: reloadPath,
  });
}
