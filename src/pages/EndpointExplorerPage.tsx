import { NavLink, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useInstanceConfig } from "@/app/useInstanceConfig";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { RequestJsonAction } from "@/components/common/RequestJsonAction";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";
import { ConstellationDisplayCaptureRequestForm } from "@/features/operations/ConstellationDisplayCaptureRequestForm";
import { DeviceConnectRequestForm } from "@/features/operations/DeviceConnectRequestForm";
import { HistogramCaptureRequestForm } from "@/features/operations/HistogramCaptureRequestForm";
import { FecSummaryCaptureRequestForm } from "@/features/operations/FecSummaryCaptureRequestForm";
import { ScqamCodewordErrorRateRequestForm } from "@/features/operations/ScqamCodewordErrorRateRequestForm";
import { SingleCaptureRequestForm } from "@/features/operations/SingleCaptureRequestForm";
import type { CaptureConnectivityInputs, CaptureConnectivityStatus } from "@/features/operations/captureConnectivity";
import {
  buildCaptureConnectivityInputsFromInstance,
  hasCompleteCaptureConnectivityInputs,
  isCaptureConnectivityOnline,
  normalizeCaptureConnectivityInputs,
} from "@/features/operations/captureConnectivity";
import { SingleSpectrumOfdmCaptureView } from "@/features/operations/SingleSpectrumOfdmCaptureView";
import { SingleSpectrumScqamCaptureView } from "@/features/operations/SingleSpectrumScqamCaptureView";
import { SpectrumFullBandCaptureRequestForm } from "@/features/operations/SpectrumFullBandCaptureRequestForm";
import { SpectrumOfdmCaptureRequestForm } from "@/features/operations/SpectrumOfdmCaptureRequestForm";
import { SingleSpectrumFriendlyCaptureView } from "@/features/operations/SingleSpectrumFriendlyCaptureView";
import { SpectrumFriendlyCaptureRequestForm } from "@/features/operations/SpectrumFriendlyCaptureRequestForm";
import { SingleAtdmaChannelStatsView } from "@/features/operations/SingleAtdmaChannelStatsView";
import { SingleFddDiplexerBandEdgeCapabilityView } from "@/features/operations/SingleFddDiplexerBandEdgeCapabilityView";
import { SingleFddSystemDiplexerConfigurationView } from "@/features/operations/SingleFddSystemDiplexerConfigurationView";
import { SingleIf31DocsisBaseCapabilityView } from "@/features/operations/SingleIf31DocsisBaseCapabilityView";
import { SingleIf31DsOfdmChannelStatsView } from "@/features/operations/SingleIf31DsOfdmChannelStatsView";
import { SingleIf31UsOfdmaChannelStatsView } from "@/features/operations/SingleIf31UsOfdmaChannelStatsView";
import { SingleIf31DsOfdmProfileStatsView } from "@/features/operations/SingleIf31DsOfdmProfileStatsView";
import { SingleIf31SystemDiplexerView } from "@/features/operations/SingleIf31SystemDiplexerView";
import { SingleDsScqamCodewordErrorRateView } from "@/features/operations/SingleDsScqamCodewordErrorRateView";
import { SingleDsScqamChannelStatsView } from "@/features/operations/SingleDsScqamChannelStatsView";
import { SingleAtdmaPreEqualizationView } from "@/features/operations/SingleAtdmaPreEqualizationView";
import { SingleChannelEstCoeffCaptureView } from "@/features/operations/SingleChannelEstCoeffCaptureView";
import { SingleConstellationDisplayCaptureView } from "@/features/operations/SingleConstellationDisplayCaptureView";
import { SingleDeviceEventLogView } from "@/features/operations/SingleDeviceEventLogView";
import { SingleFecSummaryCaptureView } from "@/features/operations/SingleFecSummaryCaptureView";
import {
  getOperationByRoutePath,
  operationNavigationItems,
  singleCaptureNavigationItems,
  spectrumAnalyzerNavigationItems,
} from "@/features/operations/operationsNavigation";
import { SingleHistogramCaptureView } from "@/features/operations/SingleHistogramCaptureView";
import { SingleInterfaceStatsView } from "@/features/operations/SingleInterfaceStatsView";
import { SingleModulationProfileCaptureView } from "@/features/operations/SingleModulationProfileCaptureView";
import { SingleUsOfdmaPreEqualizationView } from "@/features/operations/SingleUsOfdmaPreEqualizationView";
import { SingleRxMerCaptureView } from "@/features/operations/SingleRxMerCaptureView";
import { SingleSystemUpTimeView } from "@/features/operations/SingleSystemUpTimeView";
import { checkCaptureInputsOnline } from "@/services/captureConnectivityService";
import { CONNECTIVITY_STATUS_DEBOUNCE_MS } from "@/lib/constants";
import { runSingleCaptureEndpoint } from "@/services/singleCaptureService";
import { readSelectedModemContext } from "@/features/single-capture/lib/selectedModemContext";
import type {
  AtdmaChannelStatsResponse,
  FddDiplexerBandEdgeCapabilityResponse,
  FddSystemDiplexerConfigurationResponse,
  If31DocsisBaseCapabilityResponse,
  If31DsOfdmChannelStatsResponse,
  If31DsOfdmProfileStatsResponse,
  If31UsOfdmaChannelStatsResponse,
  If31SystemDiplexerResponse,
  DsScqamCodewordErrorRateRequest,
  DsScqamCodewordErrorRateResponse,
  DsScqamChannelStatsResponse,
  AtdmaPreEqualizationResponse,
  DeviceConnectRequest,
  DeviceEventLogRequest,
  DeviceEventLogResponse,
  InterfaceStatsResponse,
  SingleChannelEstCoeffCaptureResponse,
  SingleConstellationDisplayCaptureRequest,
  SingleConstellationDisplayCaptureResponse,
  SingleFecSummaryCaptureResponse,
  SingleFecSummaryCaptureRequest,
  SingleHistogramCaptureResponse,
  SingleHistogramCaptureRequest,
  SingleModulationProfileCaptureRequest,
  SingleModulationProfileCaptureResponse,
  SingleUsOfdmaPreEqualizationCaptureRequest,
  SingleUsOfdmaPreEqualizationCaptureResponse,
  SingleRxMerCaptureRequest,
  SingleRxMerCaptureResponse,
  SingleSpectrumOfdmCaptureRequest,
  SingleSpectrumOfdmCaptureResponse,
  SingleSpectrumScqamCaptureRequest,
  SingleSpectrumScqamCaptureResponse,
  SingleSpectrumFullBandCaptureRequest,
  SingleSpectrumFriendlyCaptureRequest,
  SingleSpectrumFriendlyCaptureResponse,
  SystemUpTimeResponse,
} from "@/types/api";

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildJsonFilename(label: string): string {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "operation"}.json`;
}

export function EndpointExplorerPage() {
  const location = useLocation();
  const { selectedInstance } = useInstanceConfig();
  const isSingleCaptureRoute = location.pathname.startsWith("/single-capture");
  const isSpectrumAnalyzerRoute = location.pathname.startsWith("/spectrum-analyzer");
  const [captureConnectivityInputs, setCaptureConnectivityInputs] = useState<CaptureConnectivityInputs | null>(null);
  const [captureConnectivityStatus, setCaptureConnectivityStatus] = useState<CaptureConnectivityStatus>("unknown");
  const connectivityCheckSequenceRef = useRef(0);
  const connectivityHasCheckedInitialRef = useRef(false);
  const [atdmaChannelStatsResponse, setAtdmaChannelStatsResponse] = useState<AtdmaChannelStatsResponse | null>(null);
  const [fddDiplexerBandEdgeCapabilityResponse, setFddDiplexerBandEdgeCapabilityResponse] = useState<FddDiplexerBandEdgeCapabilityResponse | null>(null);
  const [fddSystemDiplexerConfigurationResponse, setFddSystemDiplexerConfigurationResponse] = useState<FddSystemDiplexerConfigurationResponse | null>(null);
  const [if31DocsisBaseCapabilityResponse, setIf31DocsisBaseCapabilityResponse] = useState<If31DocsisBaseCapabilityResponse | null>(null);
  const [if31DsOfdmChannelStatsResponse, setIf31DsOfdmChannelStatsResponse] = useState<If31DsOfdmChannelStatsResponse | null>(null);
  const [if31DsOfdmProfileStatsResponse, setIf31DsOfdmProfileStatsResponse] = useState<If31DsOfdmProfileStatsResponse | null>(null);
  const [if31UsOfdmaChannelStatsResponse, setIf31UsOfdmaChannelStatsResponse] = useState<If31UsOfdmaChannelStatsResponse | null>(null);
  const [if31SystemDiplexerResponse, setIf31SystemDiplexerResponse] = useState<If31SystemDiplexerResponse | null>(null);
  const [dsScqamCodewordErrorRateResponse, setDsScqamCodewordErrorRateResponse] = useState<DsScqamCodewordErrorRateResponse | null>(null);
  const [dsScqamChannelStatsResponse, setDsScqamChannelStatsResponse] = useState<DsScqamChannelStatsResponse | null>(null);
  const [atdmaPreEqualizationResponse, setAtdmaPreEqualizationResponse] = useState<AtdmaPreEqualizationResponse | null>(null);
  const [rxMerResponse, setRxMerResponse] = useState<SingleRxMerCaptureResponse | null>(null);
  const [channelEstResponse, setChannelEstResponse] = useState<SingleChannelEstCoeffCaptureResponse | null>(null);
  const [constellationResponse, setConstellationResponse] = useState<SingleConstellationDisplayCaptureResponse | null>(null);
  const [eventLogResponse, setEventLogResponse] = useState<DeviceEventLogResponse | null>(null);
  const [fecSummaryResponse, setFecSummaryResponse] = useState<SingleFecSummaryCaptureResponse | null>(null);
  const [histogramResponse, setHistogramResponse] = useState<SingleHistogramCaptureResponse | null>(null);
  const [interfaceStatsResponse, setInterfaceStatsResponse] = useState<InterfaceStatsResponse | null>(null);
  const [modulationProfileResponse, setModulationProfileResponse] = useState<SingleModulationProfileCaptureResponse | null>(null);
  const [usOfdmaPreEqualizationResponse, setUsOfdmaPreEqualizationResponse] = useState<SingleUsOfdmaPreEqualizationCaptureResponse | null>(null);
  const [systemUpTimeResponse, setSystemUpTimeResponse] = useState<SystemUpTimeResponse | null>(null);
  const [spectrumFriendlyResponse, setSpectrumFriendlyResponse] = useState<SingleSpectrumFriendlyCaptureResponse | null>(null);
  const [spectrumFullBandResponse, setSpectrumFullBandResponse] = useState<SingleSpectrumFriendlyCaptureResponse | null>(null);
  const [spectrumOfdmResponse, setSpectrumOfdmResponse] = useState<SingleSpectrumOfdmCaptureResponse | null>(null);
  const [spectrumScqamResponse, setSpectrumScqamResponse] = useState<SingleSpectrumScqamCaptureResponse | null>(null);
  const selectedOperation = getOperationByRoutePath(location.pathname);
  const selectedModemDefaults = useMemo(() => {
    if (!isSingleCaptureRoute) {
      return undefined;
    }
    const selectedModem = readSelectedModemContext();
    if (!selectedModem) {
      return undefined;
    }
    return {
      macAddress: selectedModem.macAddress,
      ipAddress: selectedModem.ipAddress === "n/a" ? "" : selectedModem.ipAddress,
      community: selectedModem.snmpCommunity,
      channelIds: "",
    };
  }, [isSingleCaptureRoute, location.pathname]);
  const preferredConnectivityInputs = useMemo(() => {
    if (
      isSingleCaptureRoute
      && selectedModemDefaults
      && selectedModemDefaults.macAddress
      && selectedModemDefaults.ipAddress
      && selectedModemDefaults.community
    ) {
      return normalizeCaptureConnectivityInputs({
        macAddress: selectedModemDefaults.macAddress,
        ipAddress: selectedModemDefaults.ipAddress,
        community: selectedModemDefaults.community,
      });
    }
    return buildCaptureConnectivityInputsFromInstance(selectedInstance);
  }, [isSingleCaptureRoute, selectedInstance, selectedModemDefaults]);
  const canExecuteOperation = Boolean(selectedInstance) && isCaptureConnectivityOnline(captureConnectivityStatus);
  const captureInputsTitle = useMemo(() => {
    const label = captureConnectivityStatus === "online"
      ? "Online"
      : captureConnectivityStatus === "offline"
        ? "Offline"
        : captureConnectivityStatus === "checking"
          ? "Checking"
          : "Unknown";
    const stateClass = captureConnectivityStatus === "online"
      ? "online"
      : captureConnectivityStatus === "offline"
        ? "offline"
        : captureConnectivityStatus === "checking"
          ? "checking"
          : "unknown";

    return (
      <div className="panel-title-inline">
        <h2 className="panel-title-heading">Capture Inputs</h2>
        <span className={`capture-status-chip ${stateClass}`}>{label}</span>
      </div>
    );
  }, [captureConnectivityStatus]);

  useEffect(() => {
    connectivityHasCheckedInitialRef.current = false;
    connectivityCheckSequenceRef.current += 1;
    setCaptureConnectivityInputs(preferredConnectivityInputs);
    setCaptureConnectivityStatus("unknown");
  }, [preferredConnectivityInputs, selectedOperation?.id]);

  useEffect(() => {
    if (!selectedInstance?.baseUrl || !hasCompleteCaptureConnectivityInputs(captureConnectivityInputs)) {
      setCaptureConnectivityStatus("unknown");
      return;
    }

    const runCheck = async (requestId: number) => {
      setCaptureConnectivityStatus("checking");
      try {
        const isOnline = await checkCaptureInputsOnline(selectedInstance.baseUrl, captureConnectivityInputs);
        if (connectivityCheckSequenceRef.current !== requestId) {
          return;
        }
        setCaptureConnectivityStatus(isOnline ? "online" : "offline");
      } catch {
        if (connectivityCheckSequenceRef.current !== requestId) {
          return;
        }
        setCaptureConnectivityStatus("offline");
      }
    };

    const requestId = connectivityCheckSequenceRef.current + 1;
    connectivityCheckSequenceRef.current = requestId;

    if (!connectivityHasCheckedInitialRef.current) {
      connectivityHasCheckedInitialRef.current = true;
      void runCheck(requestId);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void runCheck(requestId);
    }, CONNECTIVITY_STATUS_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [captureConnectivityInputs, selectedInstance?.baseUrl]);

  const mutation = useMutation({
    mutationFn: ({
      endpointPath,
      payload,
    }: {
      endpointPath: string;
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
        | SingleSpectrumScqamCaptureRequest
        | SingleSpectrumFullBandCaptureRequest
        | SingleSpectrumFriendlyCaptureRequest;
    }) =>
      runSingleCaptureEndpoint<
        | AtdmaChannelStatsResponse
        | FddDiplexerBandEdgeCapabilityResponse
        | FddSystemDiplexerConfigurationResponse
        | If31DocsisBaseCapabilityResponse
        | If31DsOfdmChannelStatsResponse
        | If31DsOfdmProfileStatsResponse
        | If31UsOfdmaChannelStatsResponse
        | If31SystemDiplexerResponse
        | DsScqamCodewordErrorRateResponse
        | DsScqamChannelStatsResponse
        | AtdmaPreEqualizationResponse
        | DeviceEventLogResponse
        | SystemUpTimeResponse
        | InterfaceStatsResponse
        | SingleRxMerCaptureResponse
        | SingleChannelEstCoeffCaptureResponse
        | SingleHistogramCaptureResponse
        | SingleFecSummaryCaptureResponse
        | SingleConstellationDisplayCaptureResponse
        | SingleModulationProfileCaptureResponse
        | SingleUsOfdmaPreEqualizationCaptureResponse
        | SingleSpectrumOfdmCaptureResponse
        | SingleSpectrumScqamCaptureResponse
        | SingleSpectrumFriendlyCaptureResponse
      >(
        selectedInstance?.baseUrl ?? "",
        endpointPath,
        payload,
        selectedOperation?.requestTimeoutMs,
      ),
    onSuccess: (data) => {
      if (selectedOperation?.id === "docs-if31-docsis-basecapability") {
        setIf31DocsisBaseCapabilityResponse(data as If31DocsisBaseCapabilityResponse);
        return;
      }

      if (selectedOperation?.id === "docs-if31-ds-ofdm-chan-stats") {
        setIf31DsOfdmChannelStatsResponse(data as If31DsOfdmChannelStatsResponse);
        return;
      }

      if (selectedOperation?.id === "docs-if31-ds-ofdm-profile-stats") {
        setIf31DsOfdmProfileStatsResponse(data as If31DsOfdmProfileStatsResponse);
        return;
      }

      if (selectedOperation?.id === "docs-if31-system-diplexer") {
        setIf31SystemDiplexerResponse(data as If31SystemDiplexerResponse);
        return;
      }

      if (selectedOperation?.id === "docs-if31-us-ofdma-channel-stats") {
        setIf31UsOfdmaChannelStatsResponse(data as If31UsOfdmaChannelStatsResponse);
        return;
      }

      if (selectedOperation?.id === "docs-fdd-system-diplexer-configuration") {
        setFddSystemDiplexerConfigurationResponse(data as FddSystemDiplexerConfigurationResponse);
        return;
      }

      if (selectedOperation?.id === "docs-fdd-diplexer-bandedgecapability") {
        setFddDiplexerBandEdgeCapabilityResponse(data as FddDiplexerBandEdgeCapabilityResponse);
        return;
      }

      if (selectedOperation?.id === "docs-if30-ds-scqam-chan-codeworderrorrate") {
        setDsScqamCodewordErrorRateResponse(data as DsScqamCodewordErrorRateResponse);
        return;
      }

      if (selectedOperation?.id === "docs-if30-ds-scqam-chan-stats") {
        setDsScqamChannelStatsResponse(data as DsScqamChannelStatsResponse);
        return;
      }

      if (selectedOperation?.id === "docs-if30-us-atdma-chan-preequalization") {
        setAtdmaPreEqualizationResponse(data as AtdmaPreEqualizationResponse);
        return;
      }

      if (selectedOperation?.id === "docs-if30-us-atdma-chan-stats") {
        setAtdmaChannelStatsResponse(data as AtdmaChannelStatsResponse);
        return;
      }

      if (selectedOperation?.id === "system-uptime") {
        setSystemUpTimeResponse(data as SystemUpTimeResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-interface-stats") {
        setInterfaceStatsResponse(data as InterfaceStatsResponse);
        return;
      }

      if (selectedOperation?.id === "docs-dev-eventlog") {
        setEventLogResponse(data as DeviceEventLogResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-ofdm-rxmer-getcapture") {
        setRxMerResponse(data as SingleRxMerCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-ofdm-channelestcoeff-getcapture") {
        setChannelEstResponse(data as SingleChannelEstCoeffCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-ofdm-fecsummary-getcapture") {
        setFecSummaryResponse(data as SingleFecSummaryCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-ofdm-constellationdisplay-getcapture") {
        setConstellationResponse(data as SingleConstellationDisplayCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-ofdm-modulationprofile-getcapture") {
        setModulationProfileResponse(data as SingleModulationProfileCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-us-ofdma-preequalization-getcapture") {
        setUsOfdmaPreEqualizationResponse(data as SingleUsOfdmaPreEqualizationCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-spectrumanalyzer-getcapture-friendly") {
        setSpectrumFriendlyResponse(data as SingleSpectrumFriendlyCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-spectrumanalyzer-getcapture-fullbandcapture") {
        setSpectrumFullBandResponse(data as SingleSpectrumFriendlyCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-spectrumanalyzer-getcapture-ofdm") {
        setSpectrumOfdmResponse(data as SingleSpectrumOfdmCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-spectrumanalyzer-getcapture-scqam") {
        setSpectrumScqamResponse(data as SingleSpectrumScqamCaptureResponse);
        return;
      }

      if (selectedOperation?.id === "docs-pnm-ds-histogram-getcapture") {
        setHistogramResponse(data as SingleHistogramCaptureResponse);
      }
    },
  });

  if (!selectedOperation) {
    return (
      <Navigate
        to={isSingleCaptureRoute ? (singleCaptureNavigationItems[0]?.routePath ?? "/") : (operationNavigationItems[0]?.routePath ?? "/")}
        replace
      />
    );
  }

  const selectedResponse = selectedOperation.id === "docs-if30-ds-scqam-chan-codeworderrorrate"
    ? dsScqamCodewordErrorRateResponse
    : selectedOperation.id === "docs-if31-docsis-basecapability"
      ? if31DocsisBaseCapabilityResponse
    : selectedOperation.id === "docs-if31-ds-ofdm-chan-stats"
      ? if31DsOfdmChannelStatsResponse
    : selectedOperation.id === "docs-if31-ds-ofdm-profile-stats"
      ? if31DsOfdmProfileStatsResponse
    : selectedOperation.id === "docs-if31-system-diplexer"
      ? if31SystemDiplexerResponse
    : selectedOperation.id === "docs-if31-us-ofdma-channel-stats"
      ? if31UsOfdmaChannelStatsResponse
    : selectedOperation.id === "docs-fdd-system-diplexer-configuration"
      ? fddSystemDiplexerConfigurationResponse
    : selectedOperation.id === "docs-fdd-diplexer-bandedgecapability"
      ? fddDiplexerBandEdgeCapabilityResponse
    : selectedOperation.id === "docs-if30-ds-scqam-chan-stats"
      ? dsScqamChannelStatsResponse
      : selectedOperation.id === "docs-if30-us-atdma-chan-preequalization"
      ? atdmaPreEqualizationResponse
      : selectedOperation.id === "docs-if30-us-atdma-chan-stats"
        ? atdmaChannelStatsResponse
        : selectedOperation.id === "system-uptime"
          ? systemUpTimeResponse
          : selectedOperation.id === "docs-pnm-interface-stats"
            ? interfaceStatsResponse
            : selectedOperation.id === "docs-dev-eventlog"
              ? eventLogResponse
              : selectedOperation.id === "docs-pnm-ds-ofdm-rxmer-getcapture"
                ? rxMerResponse
                : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-friendly"
                  ? spectrumFriendlyResponse
                  : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-fullbandcapture"
                    ? spectrumFullBandResponse
                    : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-ofdm"
                      ? spectrumOfdmResponse
                    : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-scqam"
                      ? spectrumScqamResponse
                : selectedOperation.id === "docs-pnm-ds-ofdm-modulationprofile-getcapture"
                  ? modulationProfileResponse
                  : selectedOperation.id === "docs-pnm-us-ofdma-preequalization-getcapture"
                    ? usOfdmaPreEqualizationResponse
                  : selectedOperation.id === "docs-pnm-ds-ofdm-constellationdisplay-getcapture"
                    ? constellationResponse
                    : selectedOperation.id === "docs-pnm-ds-ofdm-fecsummary-getcapture"
                      ? fecSummaryResponse
                      : selectedOperation.id === "docs-pnm-ds-histogram-getcapture"
                        ? histogramResponse
                        : channelEstResponse;
  const hasCompletedSelectedOperation = mutation.isSuccess && mutation.variables?.endpointPath === selectedOperation.endpointPath;
  const requestJsonAction = (
    <RequestJsonAction
      disabled={!hasCompletedSelectedOperation}
      onClick={() => {
        if (!hasCompletedSelectedOperation) {
          return;
        }
        downloadJson(buildJsonFilename(selectedOperation.label), selectedResponse);
      }}
    >
      Download JSON
    </RequestJsonAction>
  );
  const hasSelectedResponse = selectedResponse !== null;

  return (
    <>
      {isSingleCaptureRoute ? (
        <nav className="advanced-subnav">
          {singleCaptureNavigationItems.map((item) => (
            <NavLink key={item.id} to={item.routePath} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : isSpectrumAnalyzerRoute ? (
        <nav className="advanced-subnav">
          {spectrumAnalyzerNavigationItems.map((item) => (
            <NavLink key={item.id} to={item.routePath} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
      <PageHeader title={selectedOperation.label} subtitle="" />
      <Panel title={captureInputsTitle}>
        {selectedOperation.id === "docs-if30-ds-scqam-chan-codeworderrorrate" ? (
          <ScqamCodewordErrorRateRequestForm
            isPending={mutation.isPending}
            canRun={canExecuteOperation}
            submitLabel={`Run ${selectedOperation.label}`}
            errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
            onConnectivityInputsChange={setCaptureConnectivityInputs}
            onSubmit={(payload) => {
              mutation.mutate({ endpointPath: selectedOperation.endpointPath, payload });
            }}
          />
        ) : selectedOperation.id === "docs-dev-eventlog" || selectedOperation.id === "system-uptime" || selectedOperation.id === "docs-pnm-interface-stats" || selectedOperation.id === "docs-if30-us-atdma-chan-stats" || selectedOperation.id === "docs-if30-us-atdma-chan-preequalization" || selectedOperation.id === "docs-if30-ds-scqam-chan-stats" || selectedOperation.id === "docs-fdd-diplexer-bandedgecapability" || selectedOperation.id === "docs-fdd-system-diplexer-configuration" || selectedOperation.id === "docs-if31-us-ofdma-channel-stats" || selectedOperation.id === "docs-if31-system-diplexer" || selectedOperation.id === "docs-if31-ds-ofdm-profile-stats" || selectedOperation.id === "docs-if31-ds-ofdm-chan-stats" || selectedOperation.id === "docs-if31-docsis-basecapability" ? (
          <DeviceConnectRequestForm
            isPending={mutation.isPending}
            canRun={canExecuteOperation}
            submitLabel={`Run ${selectedOperation.label}`}
            errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
            onConnectivityInputsChange={setCaptureConnectivityInputs}
            onSubmit={(payload) => {
              mutation.mutate({ endpointPath: selectedOperation.endpointPath, payload });
            }}
          />
        ) : selectedOperation.id === "docs-pnm-ds-histogram-getcapture" ? (
          <HistogramCaptureRequestForm
            isPending={mutation.isPending}
            canRun={canExecuteOperation}
            submitLabel="Get Capture"
            errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
            extraActions={requestJsonAction}
            onConnectivityInputsChange={setCaptureConnectivityInputs}
            requestDefaultsOverride={selectedModemDefaults}
            onSubmit={(payload) => {
              mutation.mutate({ endpointPath: selectedOperation.endpointPath, payload });
            }}
          />
        ) : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-friendly" ? (
          <SpectrumFriendlyCaptureRequestForm
            isPending={mutation.isPending}
            canRun={canExecuteOperation}
            submitLabel="Get Capture"
            errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
            extraActions={requestJsonAction}
            onConnectivityInputsChange={setCaptureConnectivityInputs}
            onSubmit={(payload) => {
              mutation.mutate({ endpointPath: selectedOperation.endpointPath, payload });
            }}
          />
        ) : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-fullbandcapture" ? (
          <SpectrumFullBandCaptureRequestForm
            isPending={mutation.isPending}
            canRun={canExecuteOperation}
            submitLabel="Get Capture"
            errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
            extraActions={requestJsonAction}
            onConnectivityInputsChange={setCaptureConnectivityInputs}
            onSubmit={(payload) => {
              mutation.mutate({ endpointPath: selectedOperation.endpointPath, payload });
            }}
          />
        ) : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-ofdm" || selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-scqam" ? (
          <SpectrumOfdmCaptureRequestForm
            isPending={mutation.isPending}
            canRun={canExecuteOperation}
            submitLabel="Get Capture"
            errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
            extraActions={requestJsonAction}
            onConnectivityInputsChange={setCaptureConnectivityInputs}
            onSubmit={(payload) => {
              mutation.mutate({ endpointPath: selectedOperation.endpointPath, payload });
            }}
          />
        ) : selectedOperation.id === "docs-pnm-ds-ofdm-constellationdisplay-getcapture" ? (
          <ConstellationDisplayCaptureRequestForm
            isPending={mutation.isPending}
            canRun={canExecuteOperation}
            submitLabel="Get Capture"
            errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
            extraActions={requestJsonAction}
            onConnectivityInputsChange={setCaptureConnectivityInputs}
            requestDefaultsOverride={selectedModemDefaults}
            onSubmit={(payload) => {
              mutation.mutate({ endpointPath: selectedOperation.endpointPath, payload });
            }}
          />
        ) : selectedOperation.id === "docs-pnm-ds-ofdm-fecsummary-getcapture" ? (
          <FecSummaryCaptureRequestForm
            isPending={mutation.isPending}
            canRun={canExecuteOperation}
            submitLabel="Get Capture"
            errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
            extraActions={requestJsonAction}
            onConnectivityInputsChange={setCaptureConnectivityInputs}
            requestDefaultsOverride={selectedModemDefaults}
            onSubmit={(payload) => {
              mutation.mutate({ endpointPath: selectedOperation.endpointPath, payload });
            }}
          />
        ) : (
          <SingleCaptureRequestForm
            isPending={mutation.isPending}
            canRun={canExecuteOperation}
            submitLabel="Get Capture"
            errorMessage={mutation.isError ? (mutation.error as Error).message : undefined}
            extraActions={requestJsonAction}
            onConnectivityInputsChange={setCaptureConnectivityInputs}
            requestDefaultsOverride={selectedModemDefaults}
            onSubmit={(payload) => {
              mutation.mutate({ endpointPath: selectedOperation.endpointPath, payload });
            }}
          />
        )}
      </Panel>

      {mutation.isPending ? (
        <Panel>
          <ThinkingIndicator label={`Collecting ${selectedOperation.label} data...`} />
        </Panel>
      ) : null}

      <Panel title="Results">
        {!hasSelectedResponse ? (
          <div className="details-table-wrap">
            <table className="details-table">
              <tbody>
                <tr>
                  <th>State</th>
                  <td>N/A</td>
                </tr>
                <tr>
                  <th>Result</th>
                  <td>No capture results yet. Run the operation to populate this panel.</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : selectedOperation.id === "docs-if31-docsis-basecapability" ? (
          <SingleIf31DocsisBaseCapabilityView response={if31DocsisBaseCapabilityResponse as If31DocsisBaseCapabilityResponse} />
        ) : selectedOperation.id === "docs-if31-ds-ofdm-chan-stats" ? (
          <SingleIf31DsOfdmChannelStatsView response={if31DsOfdmChannelStatsResponse as If31DsOfdmChannelStatsResponse} />
        ) : selectedOperation.id === "docs-if31-ds-ofdm-profile-stats" ? (
          <SingleIf31DsOfdmProfileStatsView response={if31DsOfdmProfileStatsResponse as If31DsOfdmProfileStatsResponse} />
        ) : selectedOperation.id === "docs-if31-system-diplexer" ? (
          <SingleIf31SystemDiplexerView response={if31SystemDiplexerResponse as If31SystemDiplexerResponse} />
        ) : selectedOperation.id === "docs-if31-us-ofdma-channel-stats" ? (
          <SingleIf31UsOfdmaChannelStatsView response={if31UsOfdmaChannelStatsResponse as If31UsOfdmaChannelStatsResponse} />
        ) : selectedOperation.id === "docs-fdd-system-diplexer-configuration" ? (
          <SingleFddSystemDiplexerConfigurationView response={fddSystemDiplexerConfigurationResponse as FddSystemDiplexerConfigurationResponse} />
        ) : selectedOperation.id === "docs-fdd-diplexer-bandedgecapability" ? (
          <SingleFddDiplexerBandEdgeCapabilityView response={fddDiplexerBandEdgeCapabilityResponse as FddDiplexerBandEdgeCapabilityResponse} />
        ) : selectedOperation.id === "docs-if30-ds-scqam-chan-codeworderrorrate" ? (
          <SingleDsScqamCodewordErrorRateView response={dsScqamCodewordErrorRateResponse as DsScqamCodewordErrorRateResponse} />
        ) : selectedOperation.id === "docs-if30-ds-scqam-chan-stats" ? (
          <SingleDsScqamChannelStatsView response={dsScqamChannelStatsResponse as DsScqamChannelStatsResponse} />
        ) : selectedOperation.id === "docs-if30-us-atdma-chan-preequalization" ? (
          <SingleAtdmaPreEqualizationView response={atdmaPreEqualizationResponse as AtdmaPreEqualizationResponse} />
        ) : selectedOperation.id === "docs-if30-us-atdma-chan-stats" ? (
          <SingleAtdmaChannelStatsView response={atdmaChannelStatsResponse as AtdmaChannelStatsResponse} />
        ) : selectedOperation.id === "system-uptime" ? (
          <SingleSystemUpTimeView response={systemUpTimeResponse as SystemUpTimeResponse} />
        ) : selectedOperation.id === "docs-pnm-interface-stats" ? (
          <SingleInterfaceStatsView response={interfaceStatsResponse as InterfaceStatsResponse} />
        ) : selectedOperation.id === "docs-dev-eventlog" ? (
          <SingleDeviceEventLogView response={eventLogResponse as DeviceEventLogResponse} />
        ) : selectedOperation.id === "docs-pnm-ds-ofdm-rxmer-getcapture" ? (
          <SingleRxMerCaptureView response={rxMerResponse as SingleRxMerCaptureResponse} />
        ) : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-friendly" ? (
          <SingleSpectrumFriendlyCaptureView response={spectrumFriendlyResponse as SingleSpectrumFriendlyCaptureResponse} exportVariant="friendly" />
        ) : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-fullbandcapture" ? (
          <SingleSpectrumFriendlyCaptureView response={spectrumFullBandResponse as SingleSpectrumFriendlyCaptureResponse} exportVariant="full-band" />
        ) : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-ofdm" ? (
          <SingleSpectrumOfdmCaptureView response={spectrumOfdmResponse as SingleSpectrumOfdmCaptureResponse} />
        ) : selectedOperation.id === "docs-pnm-ds-spectrumanalyzer-getcapture-scqam" ? (
          <SingleSpectrumScqamCaptureView response={spectrumScqamResponse as SingleSpectrumScqamCaptureResponse} />
        ) : selectedOperation.id === "docs-pnm-ds-ofdm-modulationprofile-getcapture" ? (
          <SingleModulationProfileCaptureView response={modulationProfileResponse as SingleModulationProfileCaptureResponse} />
        ) : selectedOperation.id === "docs-pnm-us-ofdma-preequalization-getcapture" ? (
          <SingleUsOfdmaPreEqualizationView response={usOfdmaPreEqualizationResponse as SingleUsOfdmaPreEqualizationCaptureResponse} />
        ) : selectedOperation.id === "docs-pnm-ds-ofdm-constellationdisplay-getcapture" ? (
          <SingleConstellationDisplayCaptureView response={constellationResponse as SingleConstellationDisplayCaptureResponse} />
        ) : selectedOperation.id === "docs-pnm-ds-ofdm-fecsummary-getcapture" ? (
          <SingleFecSummaryCaptureView response={fecSummaryResponse as SingleFecSummaryCaptureResponse} />
        ) : selectedOperation.id === "docs-pnm-ds-histogram-getcapture" ? (
          <SingleHistogramCaptureView response={histogramResponse as SingleHistogramCaptureResponse} />
        ) : (
          <SingleChannelEstCoeffCaptureView response={channelEstResponse as SingleChannelEstCoeffCaptureResponse} />
        )}
      </Panel>
    </>
  );
}
