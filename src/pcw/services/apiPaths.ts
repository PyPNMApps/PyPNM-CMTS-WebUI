export const CMTS_SERVING_GROUP_WORKER_PROCESS_PATH = "/ops/servingGroupWorker/process";
export const CMTS_SERVING_GROUP_CABLE_MODEMS_PATH = "/cmts/servingGroup/operations/get/cableModems";

export const CMTS_SERVING_GROUP_RXMER_BASE_PATH = "/cmts/pnm/sg/ds/ofdm/rxmer";
export const CMTS_SERVING_GROUP_CHANNEL_EST_COEFF_BASE_PATH = "/cmts/pnm/sg/ds/ofdm/channelEstCoeff";
export const CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH = "/cmts/pnm/sg/ds/ofdm/fecSummary";
export const CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH = "/cmts/pnm/sg/ds/ofdm/constellationDisplay";
export const CMTS_SERVING_GROUP_MODULATION_PROFILE_BASE_PATH = "/cmts/pnm/sg/ds/ofdm/modulationProfile";
export const CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH = "/cmts/pnm/sg/ds/histogram";
export const CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH = "/cmts/pnm/sg/spectrumAnalyzer";

export function buildOperationActionPath(basePath: string, action: "startCapture" | "status" | "cancel" | "results"): string {
  return `${basePath}/${action}`;
}
