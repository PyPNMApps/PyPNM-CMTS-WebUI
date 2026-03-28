import axios from "axios";

import { env } from "@/lib/env";
import { logError } from "@/lib/logger";

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.requestTimeoutMs,
});

export function requestWithBaseUrl<T>(baseURL: string, config: Parameters<typeof http.request<T>>[0]) {
  return http.request<T>({
    ...config,
    baseURL,
  });
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const method = String(error?.config?.method ?? "request").toUpperCase();
    const url = String(error?.config?.url ?? "unknown-url");
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.message;
    const code = error?.code;
    const message = backendMessage ?? error?.message ?? "Request failed";
    logError("HTTP request failed", {
      method,
      url,
      status,
      code,
      message,
      baseURL: error?.config?.baseURL,
    });
    const detail = [status ? `status ${status}` : null, code ? `code ${code}` : null, `${method} ${url}`]
      .filter(Boolean)
      .join(" · ");
    return Promise.reject(new Error(detail ? `${message} (${detail})` : String(message)));
  },
);
