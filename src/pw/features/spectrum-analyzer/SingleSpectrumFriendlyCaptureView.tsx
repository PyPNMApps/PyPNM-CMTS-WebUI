import { useMemo, useState } from "react";

import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { SpectrumSelectionSummary } from "@/components/common/SpectrumSelectionSummary";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import type { ChartSeries } from "@/pw/features/analysis/types";
import { buildExportBaseName } from "@/lib/export/naming";
import { integrateVisibleSpectrumPower, type SpectrumSelectionRange } from "@/lib/spectrumPower";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { SingleSpectrumFriendlyCaptureResponse } from "@/types/api";

type SpectrumMode = "actual" | "avg" | "both";

function formatMhz(valueHz: number | undefined): string {
  return typeof valueHz === "number" && Number.isFinite(valueHz) ? `${(valueHz / 1_000_000).toFixed(3)} MHz` : "n/a";
}

function formatRangeMhz(startHz: number | undefined, endHz: number | undefined): string {
  if (typeof startHz !== "number" || typeof endHz !== "number") return "n/a";
  return `${(startHz / 1_000_000).toFixed(3)} - ${(endHz / 1_000_000).toFixed(3)} MHz`;
}

export function SingleSpectrumFriendlyCaptureView({
  response,
  exportVariant = "friendly",
}: {
  response: SingleSpectrumFriendlyCaptureResponse;
  exportVariant?: "friendly" | "full-band";
}) {
  const [mode, setMode] = useState<SpectrumMode>("actual");
  const [selection, setSelection] = useState<SpectrumSelectionRange | null>(null);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const firstAnalysis = response.data?.analysis?.[0];

  const deviceInfo = toDeviceInfo(
    firstAnalysis?.device_details?.system_description ?? response.system_description,
    response.mac_address,
  );
  const captureParameters = firstAnalysis?.capture_parameters;
  const signalAnalysis = firstAnalysis?.signal_analysis;

  const series = useMemo<ChartSeries[]>(() => {
    if (!firstAnalysis?.signal_analysis?.frequencies?.length) {
      return [];
    }

    const frequencies = firstAnalysis.signal_analysis.frequencies;
    const actual = firstAnalysis.signal_analysis.magnitudes ?? [];
    const average = firstAnalysis.signal_analysis.window_average?.magnitudes ?? [];

    const out: ChartSeries[] = [];
    if (mode === "actual" || mode === "both") {
      out.push({
        label: "Actual",
        color: "#79a9ff",
        points: frequencies.slice(0, actual.length).map((frequency, index) => ({
          x: frequency / 1_000_000,
          y: actual[index] ?? 0,
        })),
      });
    }
    if (mode === "avg" || mode === "both") {
      out.push({
        label: "Avg",
        color: "#58d0a7",
        points: frequencies.slice(0, average.length).map((frequency, index) => ({
          x: frequency / 1_000_000,
          y: average[index] ?? 0,
        })),
      });
    }
    return out;
  }, [firstAnalysis, mode]);
  const integratedPower = useMemo(
    () => integrateVisibleSpectrumPower(series, selection, signalAnalysis?.channel_power_dbmv ?? null),
    [series, selection, signalAnalysis?.channel_power_dbmv],
  );

  if (!firstAnalysis?.signal_analysis?.frequencies?.length) {
    return <p className="panel-copy">No spectrum analyzer capture data available yet.</p>;
  }

  const centerHz = typeof captureParameters?.first_segment_center_freq === "number" && typeof captureParameters?.last_segment_center_freq === "number"
    ? (captureParameters.first_segment_center_freq + captureParameters.last_segment_center_freq) / 2
    : undefined;

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="analysis-summary-grid">
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Frequency Range</div>
          <div className="analysis-metric-value mono">
            {formatRangeMhz(captureParameters?.first_segment_center_freq, captureParameters?.last_segment_center_freq)}
          </div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Center</div>
          <div className="analysis-metric-value mono">{formatMhz(centerHz)}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Channel Power</div>
          <div className="analysis-metric-value mono">
            {typeof signalAnalysis?.channel_power_dbmv === "number" ? `${signalAnalysis.channel_power_dbmv.toFixed(2)} dBmV` : "n/a"}
          </div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Window Avg Points</div>
          <div className="analysis-metric-value mono">{signalAnalysis?.window_average?.points ?? "n/a"}</div>
        </div>
      </div>

      <Panel title="Spectrum Magnitude">
        <div className="status-chip-row">
          <button type="button" className={`analysis-chip-button${mode === "actual" ? " active" : ""}`} onClick={() => setMode("actual")}>Actual</button>
          <button type="button" className={`analysis-chip-button${mode === "avg" ? " active" : ""}`} onClick={() => setMode("avg")}>Avg</button>
          <button type="button" className={`analysis-chip-button${mode === "both" ? " active" : ""}`} onClick={() => setMode("both")}>Both</button>
        </div>
        <LineAnalysisChart
          title="Spectrum Magnitude (Actual / Avg)"
          subtitle={formatRangeMhz(captureParameters?.first_segment_center_freq, captureParameters?.last_segment_center_freq)}
          yLabel="dBmV"
          series={series}
          xDomain={zoomDomain ?? undefined}
          enableRangeSelection
          selection={selection}
          onSelectionChange={setSelection}
          selectionActions={(
            <SpectrumSelectionActions
              selection={selection}
              hasZoomDomain={zoomDomain !== null}
              onApplyZoom={(domain) => setZoomDomain(domain)}
              onResetZoom={() => setZoomDomain(null)}
            />
          )}
          exportBaseName={buildExportBaseName(
            response.mac_address,
            undefined,
            `single-spectrum-${exportVariant}`,
          )}
        />
        <SpectrumSelectionSummary selection={selection} integratedPower={integratedPower} />
      </Panel>
    </div>
  );
}
