import type { ReactNode } from "react";

import { SingleAtdmaChannelStatsView } from "@/pw/features/operations/SingleAtdmaChannelStatsView";
import { SingleAtdmaPreEqualizationView } from "@/pw/features/operations/SingleAtdmaPreEqualizationView";
import { SingleChannelEstCoeffCaptureView } from "@/pw/features/operations/SingleChannelEstCoeffCaptureView";
import { SingleConstellationDisplayCaptureView } from "@/pw/features/operations/SingleConstellationDisplayCaptureView";
import { SingleDeviceEventLogView } from "@/pw/features/operations/SingleDeviceEventLogView";
import { SingleDsScqamChannelStatsView } from "@/pw/features/operations/SingleDsScqamChannelStatsView";
import { SingleDsScqamCodewordErrorRateView } from "@/pw/features/operations/SingleDsScqamCodewordErrorRateView";
import { SingleFddDiplexerBandEdgeCapabilityView } from "@/pw/features/operations/SingleFddDiplexerBandEdgeCapabilityView";
import { SingleFddSystemDiplexerConfigurationView } from "@/pw/features/operations/SingleFddSystemDiplexerConfigurationView";
import { SingleFecSummaryCaptureView } from "@/pw/features/operations/SingleFecSummaryCaptureView";
import { SingleHistogramCaptureView } from "@/pw/features/operations/SingleHistogramCaptureView";
import { SingleIf31DocsisBaseCapabilityView } from "@/pw/features/operations/SingleIf31DocsisBaseCapabilityView";
import { SingleIf31DsOfdmChannelStatsView } from "@/pw/features/operations/SingleIf31DsOfdmChannelStatsView";
import { SingleIf31DsOfdmProfileStatsView } from "@/pw/features/operations/SingleIf31DsOfdmProfileStatsView";
import { SingleIf31SystemDiplexerView } from "@/pw/features/operations/SingleIf31SystemDiplexerView";
import { SingleIf31UsOfdmaChannelStatsView } from "@/pw/features/operations/SingleIf31UsOfdmaChannelStatsView";
import { SingleInterfaceStatsView } from "@/pw/features/operations/SingleInterfaceStatsView";
import { SingleModulationProfileCaptureView } from "@/pw/features/operations/SingleModulationProfileCaptureView";
import { SingleRxMerCaptureView } from "@/pw/features/operations/SingleRxMerCaptureView";
import { SingleSpectrumFriendlyCaptureView } from "@/pw/features/operations/SingleSpectrumFriendlyCaptureView";
import { SingleSpectrumOfdmCaptureView } from "@/pw/features/operations/SingleSpectrumOfdmCaptureView";
import { SingleSpectrumScqamCaptureView } from "@/pw/features/operations/SingleSpectrumScqamCaptureView";
import { SingleSystemUpTimeView } from "@/pw/features/operations/SingleSystemUpTimeView";
import { SingleUsOfdmaPreEqualizationView } from "@/pw/features/operations/SingleUsOfdmaPreEqualizationView";
import type {
  AtdmaChannelStatsResponse,
  AtdmaPreEqualizationResponse,
  DeviceEventLogResponse,
  DsScqamChannelStatsResponse,
  DsScqamCodewordErrorRateResponse,
  FddDiplexerBandEdgeCapabilityResponse,
  FddSystemDiplexerConfigurationResponse,
  If31DocsisBaseCapabilityResponse,
  If31DsOfdmChannelStatsResponse,
  If31DsOfdmProfileStatsResponse,
  If31SystemDiplexerResponse,
  If31UsOfdmaChannelStatsResponse,
  InterfaceStatsResponse,
  SingleChannelEstCoeffCaptureResponse,
  SingleConstellationDisplayCaptureResponse,
  SingleFecSummaryCaptureResponse,
  SingleHistogramCaptureResponse,
  SingleModulationProfileCaptureResponse,
  SingleRxMerCaptureResponse,
  SingleSpectrumFriendlyCaptureResponse,
  SingleSpectrumOfdmCaptureResponse,
  SingleSpectrumScqamCaptureResponse,
  SingleUsOfdmaPreEqualizationCaptureResponse,
  SystemUpTimeResponse,
} from "@/types/api";

export interface EndpointExplorerResponses {
  atdmaChannelStatsResponse: AtdmaChannelStatsResponse | null;
  fddDiplexerBandEdgeCapabilityResponse: FddDiplexerBandEdgeCapabilityResponse | null;
  fddSystemDiplexerConfigurationResponse: FddSystemDiplexerConfigurationResponse | null;
  if31DocsisBaseCapabilityResponse: If31DocsisBaseCapabilityResponse | null;
  if31DsOfdmChannelStatsResponse: If31DsOfdmChannelStatsResponse | null;
  if31DsOfdmProfileStatsResponse: If31DsOfdmProfileStatsResponse | null;
  if31UsOfdmaChannelStatsResponse: If31UsOfdmaChannelStatsResponse | null;
  if31SystemDiplexerResponse: If31SystemDiplexerResponse | null;
  dsScqamCodewordErrorRateResponse: DsScqamCodewordErrorRateResponse | null;
  dsScqamChannelStatsResponse: DsScqamChannelStatsResponse | null;
  atdmaPreEqualizationResponse: AtdmaPreEqualizationResponse | null;
  rxMerResponse: SingleRxMerCaptureResponse | null;
  channelEstResponse: SingleChannelEstCoeffCaptureResponse | null;
  constellationResponse: SingleConstellationDisplayCaptureResponse | null;
  eventLogResponse: DeviceEventLogResponse | null;
  fecSummaryResponse: SingleFecSummaryCaptureResponse | null;
  histogramResponse: SingleHistogramCaptureResponse | null;
  interfaceStatsResponse: InterfaceStatsResponse | null;
  modulationProfileResponse: SingleModulationProfileCaptureResponse | null;
  usOfdmaPreEqualizationResponse: SingleUsOfdmaPreEqualizationCaptureResponse | null;
  systemUpTimeResponse: SystemUpTimeResponse | null;
  spectrumFriendlyResponse: SingleSpectrumFriendlyCaptureResponse | null;
  spectrumFullBandResponse: SingleSpectrumFriendlyCaptureResponse | null;
  spectrumOfdmResponse: SingleSpectrumOfdmCaptureResponse | null;
  spectrumScqamResponse: SingleSpectrumScqamCaptureResponse | null;
}

export function renderEndpointExplorerResultsView(
  selectedOperationId: string,
  responses: EndpointExplorerResponses,
): ReactNode {
  if (selectedOperationId === "docs-if31-docsis-basecapability") {
    return <SingleIf31DocsisBaseCapabilityView response={responses.if31DocsisBaseCapabilityResponse as If31DocsisBaseCapabilityResponse} />;
  }
  if (selectedOperationId === "docs-if31-ds-ofdm-chan-stats") {
    return <SingleIf31DsOfdmChannelStatsView response={responses.if31DsOfdmChannelStatsResponse as If31DsOfdmChannelStatsResponse} />;
  }
  if (selectedOperationId === "docs-if31-ds-ofdm-profile-stats") {
    return <SingleIf31DsOfdmProfileStatsView response={responses.if31DsOfdmProfileStatsResponse as If31DsOfdmProfileStatsResponse} />;
  }
  if (selectedOperationId === "docs-if31-system-diplexer") {
    return <SingleIf31SystemDiplexerView response={responses.if31SystemDiplexerResponse as If31SystemDiplexerResponse} />;
  }
  if (selectedOperationId === "docs-if31-us-ofdma-channel-stats") {
    return <SingleIf31UsOfdmaChannelStatsView response={responses.if31UsOfdmaChannelStatsResponse as If31UsOfdmaChannelStatsResponse} />;
  }
  if (selectedOperationId === "docs-fdd-system-diplexer-configuration") {
    return <SingleFddSystemDiplexerConfigurationView response={responses.fddSystemDiplexerConfigurationResponse as FddSystemDiplexerConfigurationResponse} />;
  }
  if (selectedOperationId === "docs-fdd-diplexer-bandedgecapability") {
    return <SingleFddDiplexerBandEdgeCapabilityView response={responses.fddDiplexerBandEdgeCapabilityResponse as FddDiplexerBandEdgeCapabilityResponse} />;
  }
  if (selectedOperationId === "docs-if30-ds-scqam-chan-codeworderrorrate") {
    return <SingleDsScqamCodewordErrorRateView response={responses.dsScqamCodewordErrorRateResponse as DsScqamCodewordErrorRateResponse} />;
  }
  if (selectedOperationId === "docs-if30-ds-scqam-chan-stats") {
    return <SingleDsScqamChannelStatsView response={responses.dsScqamChannelStatsResponse as DsScqamChannelStatsResponse} />;
  }
  if (selectedOperationId === "docs-if30-us-atdma-chan-preequalization") {
    return <SingleAtdmaPreEqualizationView response={responses.atdmaPreEqualizationResponse as AtdmaPreEqualizationResponse} />;
  }
  if (selectedOperationId === "docs-if30-us-atdma-chan-stats") {
    return <SingleAtdmaChannelStatsView response={responses.atdmaChannelStatsResponse as AtdmaChannelStatsResponse} />;
  }
  if (selectedOperationId === "system-uptime") {
    return <SingleSystemUpTimeView response={responses.systemUpTimeResponse as SystemUpTimeResponse} />;
  }
  if (selectedOperationId === "docs-pnm-interface-stats") {
    return <SingleInterfaceStatsView response={responses.interfaceStatsResponse as InterfaceStatsResponse} />;
  }
  if (selectedOperationId === "docs-dev-eventlog") {
    return <SingleDeviceEventLogView response={responses.eventLogResponse as DeviceEventLogResponse} />;
  }
  if (selectedOperationId === "docs-pnm-ds-ofdm-rxmer-getcapture") {
    return <SingleRxMerCaptureView response={responses.rxMerResponse as SingleRxMerCaptureResponse} />;
  }
  if (selectedOperationId === "docs-pnm-ds-spectrumanalyzer-getcapture-friendly") {
    return <SingleSpectrumFriendlyCaptureView response={responses.spectrumFriendlyResponse as SingleSpectrumFriendlyCaptureResponse} exportVariant="friendly" />;
  }
  if (selectedOperationId === "docs-pnm-ds-spectrumanalyzer-getcapture-fullbandcapture") {
    return <SingleSpectrumFriendlyCaptureView response={responses.spectrumFullBandResponse as SingleSpectrumFriendlyCaptureResponse} exportVariant="full-band" />;
  }
  if (selectedOperationId === "docs-pnm-ds-spectrumanalyzer-getcapture-ofdm") {
    return <SingleSpectrumOfdmCaptureView response={responses.spectrumOfdmResponse as SingleSpectrumOfdmCaptureResponse} />;
  }
  if (selectedOperationId === "docs-pnm-ds-spectrumanalyzer-getcapture-scqam") {
    return <SingleSpectrumScqamCaptureView response={responses.spectrumScqamResponse as SingleSpectrumScqamCaptureResponse} />;
  }
  if (selectedOperationId === "docs-pnm-ds-ofdm-modulationprofile-getcapture") {
    return <SingleModulationProfileCaptureView response={responses.modulationProfileResponse as SingleModulationProfileCaptureResponse} />;
  }
  if (selectedOperationId === "docs-pnm-us-ofdma-preequalization-getcapture") {
    return <SingleUsOfdmaPreEqualizationView response={responses.usOfdmaPreEqualizationResponse as SingleUsOfdmaPreEqualizationCaptureResponse} />;
  }
  if (selectedOperationId === "docs-pnm-ds-ofdm-constellationdisplay-getcapture") {
    return <SingleConstellationDisplayCaptureView response={responses.constellationResponse as SingleConstellationDisplayCaptureResponse} />;
  }
  if (selectedOperationId === "docs-pnm-ds-ofdm-fecsummary-getcapture") {
    return <SingleFecSummaryCaptureView response={responses.fecSummaryResponse as SingleFecSummaryCaptureResponse} />;
  }
  if (selectedOperationId === "docs-pnm-ds-histogram-getcapture") {
    return <SingleHistogramCaptureView response={responses.histogramResponse as SingleHistogramCaptureResponse} />;
  }
  return <SingleChannelEstCoeffCaptureView response={responses.channelEstResponse as SingleChannelEstCoeffCaptureResponse} />;
}
