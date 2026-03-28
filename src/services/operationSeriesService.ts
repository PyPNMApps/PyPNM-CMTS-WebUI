import { requestWithBaseUrl } from "@/services/http";

export async function runOperationSeriesEndpoint<TResponse>(
  baseUrl: string,
  endpointPath: string,
  payload: unknown,
): Promise<TResponse> {
  const response = await requestWithBaseUrl<TResponse>(baseUrl, {
    method: "POST",
    url: endpointPath,
    data: payload,
  });

  return response.data;
}
