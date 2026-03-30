export const SERVING_GROUP_EXECUTION_DEFAULTS = {
  maxWorkers: 16,
  retryCount: 3,
  retryDelaySeconds: 5,
  perModemTimeoutSeconds: 30,
  overallTimeoutSeconds: 120,
} as const;

export const SERVING_GROUP_FEC_SUMMARY_DEFAULTS = {
  summaryType: 2,
} as const;

export const SERVING_GROUP_CONSTELLATION_DEFAULTS = {
  modulationOrderOffset: 0,
  numberSampleSymbol: 8192,
} as const;

export const SERVING_GROUP_HISTOGRAM_DEFAULTS = {
  sampleDuration: 10,
} as const;

export const SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS = {
  inactivityTimeout: 60,
  firstSegmentCenterFreq: 300000000,
  lastSegmentCenterFreq: 900000000,
  resolutionBw: 30000,
  noiseBw: 150,
  numAverages: 1,
} as const;

export const SERVING_GROUP_FORM_PLACEHOLDERS = {
  tftpIpv4: "172.19.8.28",
  tftpIpv6: "::1",
  channelIds: "0",
  snmpCommunity: "private",
  numberSampleSymbol: String(SERVING_GROUP_CONSTELLATION_DEFAULTS.numberSampleSymbol),
  modulationOrderOffset: String(SERVING_GROUP_CONSTELLATION_DEFAULTS.modulationOrderOffset),
  sampleDuration: String(SERVING_GROUP_HISTOGRAM_DEFAULTS.sampleDuration),
  inactivityTimeout: String(SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.inactivityTimeout),
  firstSegmentCenterFreq: String(SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.firstSegmentCenterFreq),
  lastSegmentCenterFreq: String(SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.lastSegmentCenterFreq),
  resolutionBw: String(SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.resolutionBw),
  noiseBw: String(SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.noiseBw),
  numAverages: String(SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.numAverages),
} as const;
