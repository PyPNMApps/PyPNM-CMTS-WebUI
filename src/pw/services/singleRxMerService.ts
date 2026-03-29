import { requestWithBaseUrl } from "@/services/http";
import { toPwApiPath } from "@/lib/pwCompat";
import type { SingleRxMerCaptureRequest, SingleRxMerCaptureResponse } from "@/types/api";

export async function runSingleRxMerCapture(
  baseUrl: string,
  payload: SingleRxMerCaptureRequest,
): Promise<SingleRxMerCaptureResponse> {
  const response = await requestWithBaseUrl<SingleRxMerCaptureResponse>(baseUrl, {
    method: "POST",
    url: toPwApiPath("/docs/pnm/ds/ofdm/rxMer/getCapture"),
    data: payload,
  });

  return response.data;
}
