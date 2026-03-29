import { useMemo, useState } from "react";

import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { SeriesVisibilityChips } from "@/components/common/SeriesVisibilityChips";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { SpectrumSelectionSummary } from "@/components/common/SpectrumSelectionSummary";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import type { ChartSeries } from "@/pw/features/analysis/types";
import { buildExportBaseName } from "@/lib/export/naming";
import { integrateVisibleSpectrumPower, type SpectrumSelectionRange } from "@/lib/spectrumPower";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { DsScqamChannelEntryData, SingleSpectrumScqamAnalysisEntry, SingleSpectrumScqamCaptureResponse } from "@/types/api";

type SpectrumMode = "actual" | "avg" | "both";

function formatMhz(valueHz: number | undefined): string {
  return typeof valueHz === "number" && Number.isFinite(valueHz) ? `${(valueHz / 1_000_000).toFixed(3)} MHz` : "n/a";
}

function formatRangeMhz(startHz: number | undefined, endHz: number | undefined): string {
  if (typeof startHz !== "number" || typeof endHz !== "number") return "n/a";
  return `${(startHz / 1_000_000).toFixed(3)} - ${(endHz / 1_000_000).toFixed(3)} MHz`;
}

function formatNumber(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "n/a";
}

function mean(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function findMinMax(values: number[]): string {
  if (!values.length) return "n/a";
  return `${Math.min(...values).toFixed(2)} / ${Math.max(...values).toFixed(2)} dB`;
}

function channelSeries(mode: SpectrumMode, analysis: SingleSpectrumScqamAnalysisEntry): ChartSeries[] {
  const frequencies = analysis.signal_analysis?.frequencies ?? [];
  const actual = analysis.signal_analysis?.magnitudes ?? [];
  const average = analysis.signal_analysis?.window_average?.magnitudes ?? [];
  const series: ChartSeries[] = [];

  if (mode === "actual" || mode === "both") {
    series.push({
      label: "Actual",
      color: "#79a9ff",
      points: frequencies.slice(0, actual.length).map((frequency, index) => ({ x: frequency / 1_000_000, y: actual[index] ?? 0 })),
    });
  }

  if (mode === "avg" || mode === "both") {
    series.push({
      label: "Moving Avg",
      color: "#58d0a7",
      points: frequencies.slice(0, average.length).map((frequency, index) => ({ x: frequency / 1_000_000, y: average[index] ?? 0 })),
    });
  }

  return series;
}

function SpectrumScqamChannelCard({
  channelId,
  analysis,
  channelStats,
}: {
  channelId: number;
  analysis: SingleSpectrumScqamAnalysisEntry;
  channelStats: DsScqamChannelEntryData | undefined;
}) {
  const [mode, setMode] = useState<SpectrumMode>("actual");
  const [selection, setSelection] = useState<SpectrumSelectionRange | null>(null);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const magnitudes = analysis.signal_analysis?.magnitudes ?? [];
  const averagePower = mean(magnitudes);
  const series = useMemo(() => channelSeries(mode, analysis), [mode, analysis]);
  const integratedPower = useMemo(
    () => integrateVisibleSpectrumPower(series, selection, analysis.signal_analysis?.channel_power_dbmv ?? null),
    [series, selection, analysis.signal_analysis?.channel_power_dbmv],
  );

  return (
    <Panel title={`Channel ${channelId}`}>
      <div className="status-chip-row">
        <span className="analysis-chip"><b>Freq</b> {formatMhz(channelStats?.docsIfDownChannelFrequency)}</span>
        <span className="analysis-chip"><b>Width</b> {formatMhz(channelStats?.docsIfDownChannelWidth)}</span>
        <span className="analysis-chip"><b>Power</b> {typeof channelStats?.docsIfDownChannelPower === "number" ? `${channelStats.docsIfDownChannelPower.toFixed(1)} dBmV` : "n/a"}</span>
        <span className="analysis-chip"><b>RxMER</b> {typeof channelStats?.docsIf3SignalQualityExtRxMER === "number" ? `${channelStats.docsIf3SignalQualityExtRxMER.toFixed(1)} dB` : "n/a"}</span>
      </div>
      <div className="status-chip-row">
        <button type="button" className={`analysis-chip-button${mode === "actual" ? " active" : ""}`} onClick={() => setMode("actual")}>Actual</button>
        <button type="button" className={`analysis-chip-button${mode === "avg" ? " active" : ""}`} onClick={() => setMode("avg")}>Avg</button>
        <button type="button" className={`analysis-chip-button${mode === "both" ? " active" : ""}`} onClick={() => setMode("both")}>Both</button>
      </div>
      <LineAnalysisChart
        title={`Spectrum Magnitude · Channel ${channelId}`}
        subtitle={`${formatRangeMhz(analysis.capture_parameters?.first_segment_center_freq, analysis.capture_parameters?.last_segment_center_freq)} · Channel Power ${typeof analysis.signal_analysis?.channel_power_dbmv === "number" ? `${analysis.signal_analysis.channel_power_dbmv.toFixed(2)} dBmV` : "n/a"}`}
        yLabel="dB"
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
          analysis.mac_address,
          undefined,
          `single-spectrum-scqam-channel-${channelId}`,
        )}
      />
      <SpectrumSelectionSummary selection={selection} integratedPower={integratedPower} />
      <table className="channel-metrics-table">
        <tbody>
          <tr><th>Modulation</th><td className="mono">{channelStats?.docsIfDownChannelModulation ?? "n/a"}</td></tr>
          <tr><th>Interleave</th><td className="mono">{channelStats?.docsIfDownChannelInterleave ?? "n/a"}</td></tr>
          <tr><th>Microreflections</th><td className="mono">{formatNumber(channelStats?.docsIfSigQMicroreflections)}</td></tr>
          <tr><th>Min / Max</th><td className="mono">{findMinMax(magnitudes)}</td></tr>
        </tbody>
      </table>
      <div className="table-scroll">
        <table className="channel-metrics-table">
          <thead>
            <tr>
              <th>Capture</th>
              <th>Freq Range</th>
              <th>Center</th>
              <th>Avg Power</th>
              <th>Min / Max</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">Capture 1</td>
              <td className="mono">{formatRangeMhz(analysis.capture_parameters?.first_segment_center_freq, analysis.capture_parameters?.last_segment_center_freq)}</td>
              <td className="mono">{formatMhz(((analysis.capture_parameters?.first_segment_center_freq ?? 0) + (analysis.capture_parameters?.last_segment_center_freq ?? 0)) / 2)}</td>
              <td className="mono">{typeof averagePower === "number" ? `${averagePower.toFixed(2)} dB` : "n/a"}</td>
              <td className="mono">{findMinMax(magnitudes)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function SingleSpectrumScqamCaptureView({ response }: { response: SingleSpectrumScqamCaptureResponse }) {
  const [combinedSelection, setCombinedSelection] = useState<SpectrumSelectionRange | null>(null);
  const [combinedZoomDomain, setCombinedZoomDomain] = useState<[number, number] | null>(null);
  const [combinedVisibility, setCombinedVisibility] = useState<Record<string, boolean>>({});
  const analyses = response.data?.analyses ?? [];
  const measurementStats = response.data?.measurement_stats ?? [];
  const deviceInfo = toDeviceInfo(
    analyses[0]?.device_details?.system_description ?? response.system_description,
    analyses[0]?.mac_address ?? response.mac_address,
  );

  const channels = analyses.map((analysis, index) => {
    const measurement = measurementStats[index];
    const channelStats = measurement?.channel_stats?.entry;
    const channelId = channelStats?.docsIfDownChannelId ?? index;
    return { analysis, channelStats, channelId };
  });

  const combinedSeries = channels.flatMap(({ analysis, channelId }, index) => {
    const frequencies = analysis.signal_analysis?.frequencies ?? [];
    const actual = analysis.signal_analysis?.magnitudes ?? [];
    return frequencies.length
      ? [{
          label: `Channel ${channelId}`,
          color: ["#79a9ff", "#58d0a7", "#f59e0b", "#ef4444", "#a78bfa"][index % 5],
          points: frequencies.slice(0, actual.length).map((frequency, pointIndex) => ({ x: frequency / 1_000_000, y: actual[pointIndex] ?? 0 })),
        }]
      : [];
  });
  const visibleCombinedSeries = combinedSeries.filter((entry) => combinedVisibility[entry.label] !== false);
  const combinedPowerByLabel = Object.fromEntries(
    channels.map(({ analysis, channelId }) => [`Channel ${channelId}`, analysis.signal_analysis?.channel_power_dbmv ?? null]),
  );
  const combinedIntegratedPower = useMemo(
    () => integrateVisibleSpectrumPower(visibleCombinedSeries, combinedSelection, combinedPowerByLabel),
    [visibleCombinedSeries, combinedSelection, combinedPowerByLabel],
  );

  if (!channels.length) {
    return <p className="panel-copy">No SCQAM spectrum analyzer data available yet.</p>;
  }

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />
      <div className="status-chip-row">
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Total Captures</b> {analyses.length}</span>
      </div>
      <Panel title="Combined Spectrum Overlay">
        <SeriesVisibilityChips
          series={combinedSeries}
          visibility={combinedVisibility}
          onToggle={(label) => setCombinedVisibility((current) => ({ ...current, [label]: current[label] === false }))}
        />
        <LineAnalysisChart
          title="All Channels / Captures"
          subtitle="All SCQAM captures aligned by frequency"
          yLabel="dB"
          showLegend={false}
          series={visibleCombinedSeries}
          xDomain={combinedZoomDomain ?? undefined}
          enableRangeSelection
          selection={combinedSelection}
          onSelectionChange={setCombinedSelection}
          selectionActions={(
            <SpectrumSelectionActions
              selection={combinedSelection}
              hasZoomDomain={combinedZoomDomain !== null}
              onApplyZoom={(domain) => setCombinedZoomDomain(domain)}
              onResetZoom={() => setCombinedZoomDomain(null)}
            />
          )}
          exportBaseName={buildExportBaseName(
            analyses[0]?.mac_address ?? response.mac_address,
            undefined,
            "single-spectrum-scqam-combined",
          )}
        />
        <SpectrumSelectionSummary selection={combinedSelection} integratedPower={combinedIntegratedPower} />
      </Panel>
      <div className="if31-ds-ofdm-channel-grid">
        {channels.map(({ analysis, channelStats, channelId }) => (
          <SpectrumScqamChannelCard
            key={`${channelId}-${analysis.capture_parameters?.first_segment_center_freq ?? "na"}`}
            channelId={channelId}
            analysis={analysis}
            channelStats={channelStats}
          />
        ))}
      </div>
    </div>
  );
}
