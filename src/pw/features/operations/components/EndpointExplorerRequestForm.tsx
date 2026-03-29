import type { ReactNode } from "react";

import type { CaptureConnectivityInputs } from "@/pw/features/operations/captureConnectivity";
import type { CommonRequestFormDefaults } from "@/pw/features/operations/useRequestFormDefaults";
import { ConstellationDisplayCaptureRequestForm } from "@/pw/features/operations/ConstellationDisplayCaptureRequestForm";
import { DeviceConnectRequestForm } from "@/pw/features/operations/DeviceConnectRequestForm";
import { FecSummaryCaptureRequestForm } from "@/pw/features/operations/FecSummaryCaptureRequestForm";
import { HistogramCaptureRequestForm } from "@/pw/features/operations/HistogramCaptureRequestForm";
import { ScqamCodewordErrorRateRequestForm } from "@/pw/features/operations/ScqamCodewordErrorRateRequestForm";
import { SingleCaptureRequestForm } from "@/pw/features/operations/SingleCaptureRequestForm";
import { SpectrumFriendlyCaptureRequestForm } from "@/pw/features/operations/SpectrumFriendlyCaptureRequestForm";
import { SpectrumFullBandCaptureRequestForm } from "@/pw/features/operations/SpectrumFullBandCaptureRequestForm";
import { SpectrumOfdmCaptureRequestForm } from "@/pw/features/operations/SpectrumOfdmCaptureRequestForm";

export interface EndpointExplorerRequestFormParams {
  selectedOperationId: string;
  selectedOperationLabel: string;
  isPending: boolean;
  canRun: boolean;
  errorMessage?: string;
  requestJsonAction: ReactNode;
  requestDefaultsOverride?: Partial<CommonRequestFormDefaults>;
  onConnectivityInputsChange: (inputs: CaptureConnectivityInputs) => void;
  onSubmit: (payload: unknown) => void;
}

export function renderEndpointExplorerRequestForm(params: EndpointExplorerRequestFormParams): ReactNode {
  if (params.selectedOperationId === "docs-if30-ds-scqam-chan-codeworderrorrate") {
    return (
      <ScqamCodewordErrorRateRequestForm
        isPending={params.isPending}
        canRun={params.canRun}
        submitLabel={`Run ${params.selectedOperationLabel}`}
        errorMessage={params.errorMessage}
        onConnectivityInputsChange={params.onConnectivityInputsChange}
        onSubmit={params.onSubmit}
      />
    );
  }

  if (params.selectedOperationId === "docs-dev-eventlog"
    || params.selectedOperationId === "system-uptime"
    || params.selectedOperationId === "docs-pnm-interface-stats"
    || params.selectedOperationId === "docs-if30-us-atdma-chan-stats"
    || params.selectedOperationId === "docs-if30-us-atdma-chan-preequalization"
    || params.selectedOperationId === "docs-if30-ds-scqam-chan-stats"
    || params.selectedOperationId === "docs-fdd-diplexer-bandedgecapability"
    || params.selectedOperationId === "docs-fdd-system-diplexer-configuration"
    || params.selectedOperationId === "docs-if31-us-ofdma-channel-stats"
    || params.selectedOperationId === "docs-if31-system-diplexer"
    || params.selectedOperationId === "docs-if31-ds-ofdm-profile-stats"
    || params.selectedOperationId === "docs-if31-ds-ofdm-chan-stats"
    || params.selectedOperationId === "docs-if31-docsis-basecapability"
  ) {
    return (
      <DeviceConnectRequestForm
        isPending={params.isPending}
        canRun={params.canRun}
        submitLabel={`Run ${params.selectedOperationLabel}`}
        errorMessage={params.errorMessage}
        onConnectivityInputsChange={params.onConnectivityInputsChange}
        onSubmit={params.onSubmit}
      />
    );
  }

  if (params.selectedOperationId === "docs-pnm-ds-histogram-getcapture") {
    return (
      <HistogramCaptureRequestForm
        isPending={params.isPending}
        canRun={params.canRun}
        submitLabel="Get Capture"
        errorMessage={params.errorMessage}
        extraActions={params.requestJsonAction}
        onConnectivityInputsChange={params.onConnectivityInputsChange}
        requestDefaultsOverride={params.requestDefaultsOverride}
        onSubmit={params.onSubmit}
      />
    );
  }

  if (params.selectedOperationId === "docs-pnm-ds-spectrumanalyzer-getcapture-friendly") {
    return (
      <SpectrumFriendlyCaptureRequestForm
        isPending={params.isPending}
        canRun={params.canRun}
        submitLabel="Get Capture"
        errorMessage={params.errorMessage}
        extraActions={params.requestJsonAction}
        onConnectivityInputsChange={params.onConnectivityInputsChange}
        onSubmit={params.onSubmit}
      />
    );
  }

  if (params.selectedOperationId === "docs-pnm-ds-spectrumanalyzer-getcapture-fullbandcapture") {
    return (
      <SpectrumFullBandCaptureRequestForm
        isPending={params.isPending}
        canRun={params.canRun}
        submitLabel="Get Capture"
        errorMessage={params.errorMessage}
        extraActions={params.requestJsonAction}
        onConnectivityInputsChange={params.onConnectivityInputsChange}
        onSubmit={params.onSubmit}
      />
    );
  }

  if (params.selectedOperationId === "docs-pnm-ds-spectrumanalyzer-getcapture-ofdm"
    || params.selectedOperationId === "docs-pnm-ds-spectrumanalyzer-getcapture-scqam"
  ) {
    return (
      <SpectrumOfdmCaptureRequestForm
        isPending={params.isPending}
        canRun={params.canRun}
        submitLabel="Get Capture"
        errorMessage={params.errorMessage}
        extraActions={params.requestJsonAction}
        onConnectivityInputsChange={params.onConnectivityInputsChange}
        onSubmit={params.onSubmit}
      />
    );
  }

  if (params.selectedOperationId === "docs-pnm-ds-ofdm-constellationdisplay-getcapture") {
    return (
      <ConstellationDisplayCaptureRequestForm
        isPending={params.isPending}
        canRun={params.canRun}
        submitLabel="Get Capture"
        errorMessage={params.errorMessage}
        extraActions={params.requestJsonAction}
        onConnectivityInputsChange={params.onConnectivityInputsChange}
        requestDefaultsOverride={params.requestDefaultsOverride}
        onSubmit={params.onSubmit}
      />
    );
  }

  if (params.selectedOperationId === "docs-pnm-ds-ofdm-fecsummary-getcapture") {
    return (
      <FecSummaryCaptureRequestForm
        isPending={params.isPending}
        canRun={params.canRun}
        submitLabel="Get Capture"
        errorMessage={params.errorMessage}
        extraActions={params.requestJsonAction}
        onConnectivityInputsChange={params.onConnectivityInputsChange}
        requestDefaultsOverride={params.requestDefaultsOverride}
        onSubmit={params.onSubmit}
      />
    );
  }

  return (
    <SingleCaptureRequestForm
      isPending={params.isPending}
      canRun={params.canRun}
      submitLabel="Get Capture"
      errorMessage={params.errorMessage}
      extraActions={params.requestJsonAction}
      onConnectivityInputsChange={params.onConnectivityInputsChange}
      requestDefaultsOverride={params.requestDefaultsOverride}
      onSubmit={params.onSubmit}
    />
  );
}
