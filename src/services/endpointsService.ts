import { parseOpenApiEndpoints } from "@/features/endpoint-explorer/openApi";
import { requestWithBaseUrl } from "@/services/http";
import type { EndpointDescriptor } from "@/types/api";

export async function listEndpoints(baseUrl: string): Promise<EndpointDescriptor[]> {
  const response = await requestWithBaseUrl(baseUrl, {
    method: "GET",
    url: "/openapi.json",
  });

  return parseOpenApiEndpoints(response.data as Record<string, unknown>);
}
