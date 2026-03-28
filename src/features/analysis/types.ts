export interface AnalysisRequestContext {
  endpoint: string;
  analysis: string;
  captureGroup: string;
  captureTime: string;
}

export interface DeviceInfo {
  macAddress: string;
  MODEL: string;
  VENDOR: string;
  SW_REV: string;
  HW_REV: string;
  BOOTR: string;
}

export interface EchoEntry {
  type: "Direct" | "Echo";
  rank: number;
  delayUs: number;
  distanceM: number;
  distanceFt: number;
  amplitude: number;
}

export type ChannelStateClass = "ok" | "maybe" | "warn";

export interface AnalysisChannel {
  channelId: number;
  frequency: number[];
  avg: number[];
  captures: number;
  sampleRateMHz: number;
  velocityFactor: number;
  rippleP2PDb: number;
  notchCount: number;
  echoCount: number;
  state: string;
  stateClass: ChannelStateClass;
  echoes: EchoEntry[];
}

export interface RxMerEchoAnalysisFixture {
  status: string;
  requestContext: AnalysisRequestContext;
  deviceInfo: DeviceInfo;
  channels: AnalysisChannel[];
}

export interface ChartPoint {
  x: number;
  y: number;
}

export interface ChartSeries {
  label: string;
  color: string;
  points: ChartPoint[];
}

export interface ChannelMetricSummary {
  avg: number;
  min: number;
  max: number;
}

export interface AnalysisSummary {
  channelCount: number;
  echoChannels: number;
  standingWaveChannels: number;
  cleanChannels: number;
  totalEchoes: number;
}
