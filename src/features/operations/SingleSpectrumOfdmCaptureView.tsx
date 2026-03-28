import { useMemo, useState } from "react";

import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { SeriesVisibilityChips } from "@/components/common/SeriesVisibilityChips";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { SpectrumSelectionSummary } from "@/components/common/SpectrumSelectionSummary";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import type { ChartSeries } from "@/features/analysis/types";
import { buildExportBaseName } from "@/lib/export/naming";
import { integrateVisibleSpectrumPower, type SpectrumSelectionRange } from "@/lib/spectrumPower";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import { CHART_SERIES_PALETTE, CHART_SERIES_PALETTE_SIZE } from "@/lib/constants";
import type { If31DsOfdmChannelStatsEntryData, SingleSpectrumOfdmAnalysisEntry, SingleSpectrumOfdmCaptureResponse } from "@/types/api";

type SpectrumMode = "actual" | "avg" | "both";
type SpectrumOfdmAnalysis = SingleSpectrumOfdmAnalysisEntry;

function formatMhz(valueHz: number | undefined): string {
  return typeof valueHz === "number" && Number.isFinite(valueHz) ? `${(valueHz / 1_000_000).toFixed(3)} MHz` : "n/a";
}

function formatRangeMhz(startHz: number | undefined, endHz: number | undefined): string {
  if (typeof startHz !== "number" || typeof endHz !== "number") return "n/a";
  return `${(startHz / 1_000_000).toFixed(3)} - ${(endHz / 1_000_000).toFixed(3)} MHz`;
}

function channelSeries(mode: SpectrumMode, analysis: SpectrumOfdmAnalysis): ChartSeries[] {
  const frequencies = analysis.signal_analysis?.frequencies ?? [];
  const actual = analysis.signal_analysis?.magnitudes ?? [];
  const average = analysis.signal_analysis?.window_average?.magnitudes ?? [];
  const series: ChartSeries[] = [];
  if (mode === "actual" || mode === "both") {
    series.push({
      label: "Actual",
      color: "#79a9ff",
      points: frequencies.slice(0, actual.length).map((frequency: number, index: number) => ({ x: frequency / 1_000_000, y: actual[index] ?? 0 })),
    });
  }
  if (mode === "avg" || mode === "both") {
    series.push({
      label: "Moving Avg",
      color: "#58d0a7",
      points: frequencies.slice(0, average.length).map((frequency: number, index: number) => ({ x: frequency / 1_000_000, y: average[index] ?? 0 })),
    });
  }
  return series;
}

function mean(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function findMinMax(values: number[]): string {
  if (!values.length) return "n/a";
  return `${Math.min(...values).toFixed(2)} / ${Math.max(...values).toFixed(2)} dB`;
}

function asChannelStats(entry: If31DsOfdmChannelStatsEntryData | undefined) {
  return {
    indicator: entry?.docsIf31CmDsOfdmChanChanIndicator ?? "n/a",
    zeroFrequency: formatMhz(entry?.docsIf31CmDsOfdmChanSubcarrierZeroFreq),
    plcFrequency: formatMhz(entry?.docsIf31CmDsOfdmChanPlcFreq),
    subcarrierSpacing: typeof entry?.docsIf31CmDsOfdmChanSubcarrierSpacing === "number" ? `${(entry.docsIf31CmDsOfdmChanSubcarrierSpacing / 1000).toFixed(0)} kHz` : "n/a",
    activeSubcarriers: entry?.docsIf31CmDsOfdmChanNumActiveSubcarriers ?? "n/a",
    cyclicPrefix: entry?.docsIf31CmDsOfdmChanCyclicPrefix ?? "n/a",
    rollOff: entry?.docsIf31CmDsOfdmChanRollOffPeriod ?? "n/a",
    pilots: entry?.docsIf31CmDsOfdmChanNumPilots ?? "n/a",
    interleaverDepth: entry?.docsIf31CmDsOfdmChanTimeInterleaverDepth ?? "n/a",
  };
}

function SpectrumOfdmChannelCard({
  channelId,
  analysis,
  channelStats,
}: {
  channelId: number;
  analysis: SpectrumOfdmAnalysis;
  channelStats: If31DsOfdmChannelStatsEntryData | undefined;
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
  const stats = asChannelStats(channelStats);

  return (
    <Panel title={`Channel ${channelId}`}>
      <div className="status-chip-row">
        <span className="analysis-chip"><b>Range</b> {formatRangeMhz(analysis.capture_parameters?.first_segment_center_freq, analysis.capture_parameters?.last_segment_center_freq)}</span>
        <span className="analysis-chip"><b>Center</b> {formatMhz(((analysis.capture_parameters?.first_segment_center_freq ?? 0) + (analysis.capture_parameters?.last_segment_center_freq ?? 0)) / 2)}</span>
        <span className="analysis-chip"><b>Avg Power</b> {typeof averagePower === "number" ? `${averagePower.toFixed(2)} dB` : "n/a"}</span>
      </div>
      <div className="status-chip-row">
        <button type="button" className={`analysis-chip-button${mode === "actual" ? " active" : ""}`} onClick={() => setMode("actual")}>Actual</button>
        <button type="button" className={`analysis-chip-button${mode === "avg" ? " active" : ""}`} onClick={() => setMode("avg")}>Moving Avg</button>
        <button type="button" className={`analysis-chip-button${mode === "both" ? " active" : ""}`} onClick={() => setMode("both")}>Both</button>
      </div>
      <LineAnalysisChart
        title={`Spectrum Magnitude · Channel ${channelId}`}
        subtitle={formatRangeMhz(analysis.capture_parameters?.first_segment_center_freq, analysis.capture_parameters?.last_segment_center_freq)}
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
          `single-spectrum-ofdm-channel-${channelId}`,
        )}
      />
      <SpectrumSelectionSummary selection={selection} integratedPower={integratedPower} />
      <table className="channel-metrics-table">
        <tbody>
          <tr><th>Indicator</th><td className="mono">{stats.indicator}</td></tr>
          <tr><th>Zero Frequency</th><td className="mono">{stats.zeroFrequency}</td></tr>
          <tr><th>PLC Frequency</th><td className="mono">{stats.plcFrequency}</td></tr>
          <tr><th>Subcarrier Spacing</th><td className="mono">{stats.subcarrierSpacing}</td></tr>
          <tr><th>Num Active Subcarriers</th><td className="mono">{stats.activeSubcarriers}</td></tr>
          <tr><th>Cyclic Prefix</th><td className="mono">{stats.cyclicPrefix}</td></tr>
          <tr><th>Roll-Off Period</th><td className="mono">{stats.rollOff}</td></tr>
          <tr><th>Pilots</th><td className="mono">{stats.pilots}</td></tr>
          <tr><th>Time Interleaver Depth</th><td className="mono">{stats.interleaverDepth}</td></tr>
          <tr><th>Min / Max</th><td className="mono">{findMinMax(magnitudes)}</td></tr>
        </tbody>
      </table>
    </Panel>
  );
}

export function SingleSpectrumOfdmCaptureView({ response }: { response: SingleSpectrumOfdmCaptureResponse }) {
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
    const channelId = channelStats?.docsIf31CmDsOfdmChanChannelId ?? index;
    return { analysis, channelStats, channelId };
  });

  const combinedSeries = channels.flatMap(({ analysis, channelId }, index) => {
    const frequencies = analysis.signal_analysis?.frequencies ?? [];
    const actual = analysis.signal_analysis?.magnitudes ?? [];
    return frequencies.length ? [{
      label: `Channel ${channelId}`,
      color: CHART_SERIES_PALETTE[index % CHART_SERIES_PALETTE_SIZE],
      points: frequencies.slice(0, actual.length).map((frequency, pointIndex) => ({ x: frequency / 1_000_000, y: actual[pointIndex] ?? 0 })),
    }] : [];
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
    return <p className="panel-copy">No OFDM spectrum analyzer data available yet.</p>;
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
          subtitle="All OFDM captures aligned by frequency"
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
            "single-spectrum-ofdm-combined",
          )}
        />
        <SpectrumSelectionSummary selection={combinedSelection} integratedPower={combinedIntegratedPower} />
      </Panel>
      <div className="if31-ds-ofdm-channel-grid">
        {channels.map(({ analysis, channelStats, channelId }) => (
          <SpectrumOfdmChannelCard
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
