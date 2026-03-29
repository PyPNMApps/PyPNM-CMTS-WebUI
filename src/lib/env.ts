import type { AppEnv } from "@/types/env";

const fallbackBaseUrl = "http://127.0.0.1:8080";
const fallbackPwWebUiBaseUrl = "http://127.0.0.1:4173";

function asInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const env: AppEnv = {
  apiBaseUrl: import.meta.env.VITE_PYPNM_API_BASE_URL ?? fallbackBaseUrl,
  pwWebUiBaseUrl: import.meta.env.VITE_PW_WEBUI_BASE_URL ?? fallbackPwWebUiBaseUrl,
  requestTimeoutMs: asInt(import.meta.env.VITE_REQUEST_TIMEOUT_MS, 30000),
};
