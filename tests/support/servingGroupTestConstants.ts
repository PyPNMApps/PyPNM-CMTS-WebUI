import { ADVANCED_OPERATION_START_TIMEOUT_MS, ADVANCED_OPERATION_STATUS_TIMEOUT_MS } from "../../src/lib/constants";
import {
  CMTS_SERVING_GROUP_CABLE_MODEMS_PATH,
  CMTS_SERVING_GROUP_CHANNEL_EST_COEFF_BASE_PATH,
  CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH,
  CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH,
  CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH,
  CMTS_SERVING_GROUP_MODULATION_PROFILE_BASE_PATH,
  CMTS_SERVING_GROUP_OFDMA_PRE_EQ_BASE_PATH,
  CMTS_SERVING_GROUP_RXMER_BASE_PATH,
  CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH,
  buildOperationActionPath,
} from "../../src/pcw/services/apiPaths";

export const TEST_BASE_URL = "http://127.0.0.1:8080";
export const TEST_OPERATION_ID = "op-1";

export const TEST_MAC_ADDRESS = "00:11:22:33:44:55";
export const TEST_MODEM_IPV4 = "10.1.0.10";
export const TEST_TFTP_IPV4 = "172.19.8.28";
export const TEST_TFTP_IPV6 = "::1";
export const TEST_SNMP_COMMUNITY = "private";
export const TEST_SERVING_GROUP_ID = 101;

export const TEST_EXECUTION = {
  max_workers: 16,
  retry_count: 3,
  retry_delay_seconds: 5,
  per_modem_timeout_seconds: 30,
  overall_timeout_seconds: 120,
} as const;

export const TEST_TIMEOUTS = {
  start: ADVANCED_OPERATION_START_TIMEOUT_MS,
  status: ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
} as const;

export function buildServingGroupCapturePayload() {
  return {
    cmts: {
      serving_group: { id: [TEST_SERVING_GROUP_ID] },
      cable_modem: {
        mac_address: [TEST_MAC_ADDRESS],
        pnm_parameters: {
          tftp: { ipv4: TEST_TFTP_IPV4, ipv6: TEST_TFTP_IPV6 },
          capture: { channel_ids: [0] },
        },
        snmp: {
          snmpV2C: { community: TEST_SNMP_COMMUNITY },
        },
      },
    },
    execution: { ...TEST_EXECUTION },
  };
}

export const TEST_OPERATION_URLS = {
  rxmer: {
    start: buildOperationActionPath(CMTS_SERVING_GROUP_RXMER_BASE_PATH, "startCapture"),
    status: buildOperationActionPath(CMTS_SERVING_GROUP_RXMER_BASE_PATH, "status"),
    cancel: buildOperationActionPath(CMTS_SERVING_GROUP_RXMER_BASE_PATH, "cancel"),
    results: buildOperationActionPath(CMTS_SERVING_GROUP_RXMER_BASE_PATH, "results"),
  },
  channelEstCoeff: {
    start: buildOperationActionPath(CMTS_SERVING_GROUP_CHANNEL_EST_COEFF_BASE_PATH, "startCapture"),
    status: buildOperationActionPath(CMTS_SERVING_GROUP_CHANNEL_EST_COEFF_BASE_PATH, "status"),
    cancel: buildOperationActionPath(CMTS_SERVING_GROUP_CHANNEL_EST_COEFF_BASE_PATH, "cancel"),
    results: buildOperationActionPath(CMTS_SERVING_GROUP_CHANNEL_EST_COEFF_BASE_PATH, "results"),
  },
  ofdmaPreEq: {
    start: buildOperationActionPath(CMTS_SERVING_GROUP_OFDMA_PRE_EQ_BASE_PATH, "startCapture"),
    status: buildOperationActionPath(CMTS_SERVING_GROUP_OFDMA_PRE_EQ_BASE_PATH, "status"),
    cancel: buildOperationActionPath(CMTS_SERVING_GROUP_OFDMA_PRE_EQ_BASE_PATH, "cancel"),
    results: buildOperationActionPath(CMTS_SERVING_GROUP_OFDMA_PRE_EQ_BASE_PATH, "results"),
  },
  fecSummary: {
    start: buildOperationActionPath(CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH, "startCapture"),
    status: buildOperationActionPath(CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH, "status"),
    cancel: buildOperationActionPath(CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH, "cancel"),
    results: buildOperationActionPath(CMTS_SERVING_GROUP_FEC_SUMMARY_BASE_PATH, "results"),
  },
  constellationDisplay: {
    start: buildOperationActionPath(CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, "startCapture"),
    status: buildOperationActionPath(CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, "status"),
    cancel: buildOperationActionPath(CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, "cancel"),
    results: buildOperationActionPath(CMTS_SERVING_GROUP_CONSTELLATION_DISPLAY_BASE_PATH, "results"),
  },
  modulationProfile: {
    start: buildOperationActionPath(CMTS_SERVING_GROUP_MODULATION_PROFILE_BASE_PATH, "startCapture"),
    status: buildOperationActionPath(CMTS_SERVING_GROUP_MODULATION_PROFILE_BASE_PATH, "status"),
    cancel: buildOperationActionPath(CMTS_SERVING_GROUP_MODULATION_PROFILE_BASE_PATH, "cancel"),
    results: buildOperationActionPath(CMTS_SERVING_GROUP_MODULATION_PROFILE_BASE_PATH, "results"),
  },
  histogram: {
    start: buildOperationActionPath(CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH, "startCapture"),
    status: buildOperationActionPath(CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH, "status"),
    cancel: buildOperationActionPath(CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH, "cancel"),
    results: buildOperationActionPath(CMTS_SERVING_GROUP_HISTOGRAM_BASE_PATH, "results"),
  },
  spectrumAnalyzer: {
    start: buildOperationActionPath(CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, "startCapture"),
    status: buildOperationActionPath(CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, "status"),
    cancel: buildOperationActionPath(CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, "cancel"),
    results: buildOperationActionPath(CMTS_SERVING_GROUP_SPECTRUM_ANALYZER_BASE_PATH, "results"),
  },
  cableModems: CMTS_SERVING_GROUP_CABLE_MODEMS_PATH,
} as const;
