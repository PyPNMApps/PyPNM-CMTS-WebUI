import { requestWithBaseUrl } from "@/services/http";
import type {
  DeviceConnectRequest,
  DsScqamCodewordErrorRateRequest,
  DeviceEventLogRequest,
  SingleConstellationDisplayCaptureRequest,
  SingleFecSummaryCaptureRequest,
  SingleHistogramCaptureRequest,
  SingleModulationProfileCaptureRequest,
  SingleRxMerCaptureRequest,
  SingleSpectrumOfdmCaptureRequest,
  SingleSpectrumFullBandCaptureRequest,
  SingleSpectrumFriendlyCaptureRequest,
  SingleUsOfdmaPreEqualizationCaptureRequest,
} from "@/types/api";

export async function runSingleCaptureEndpoint<TResponse>(
  baseUrl: string,
  endpointPath: string,
  payload:
    | DeviceConnectRequest
    | DsScqamCodewordErrorRateRequest
    | DeviceEventLogRequest
    | SingleRxMerCaptureRequest
    | SingleHistogramCaptureRequest
    | SingleFecSummaryCaptureRequest
    | SingleConstellationDisplayCaptureRequest
    | SingleModulationProfileCaptureRequest
    | SingleUsOfdmaPreEqualizationCaptureRequest
    | SingleSpectrumOfdmCaptureRequest
    | SingleSpectrumFullBandCaptureRequest
    | SingleSpectrumFriendlyCaptureRequest,
  timeoutMs?: number,
): Promise<TResponse> {
  const response = await requestWithBaseUrl<TResponse>(baseUrl, {
    method: "POST",
    timeout: timeoutMs,
    url: endpointPath,
    data: payload,
  });

  return response.data;
}
