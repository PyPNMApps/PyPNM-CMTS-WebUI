import { useMemo, useState } from "react";

import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { FoldablePanelTitle } from "@/components/common/FoldablePanelTitle";
import { Panel } from "@/components/common/Panel";
import { SeriesVisibilityChips } from "@/components/common/SeriesVisibilityChips";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { SpectrumSelectionSummary } from "@/components/common/SpectrumSelectionSummary";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import type { ChartSeries } from "@/pw/features/analysis/types";
import { SpectrumChannelPreviewTable } from "@/pw/features/spectrum-analyzer/components/SpectrumChannelPreviewTable";
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

function formatDbmv(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)} dBmV` : "n/a";
}

function formatDb(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)} dB` : "n/a";
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

function SpectrumOfdmChannelDetail({
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
  const receivePowerDbmv = analysis.signal_analysis?.channel_power_dbmv;
  const rxMerDb = (channelStats as unknown as Record<string, unknown> | undefined)?.docsIf3SignalQualityExtRxMER;
  const rxMerNumber = typeof rxMerDb === "number" ? rxMerDb : undefined;

  return (
    <div className="spectrum-channel-detail-card">
      <div className="status-chip-row">
        <span className="analysis-chip"><b>Range</b> {formatRangeMhz(analysis.capture_parameters?.first_segment_center_freq, analysis.capture_parameters?.last_segment_center_freq)}</span>
        <span className="analysis-chip"><b>Center</b> {formatMhz(((analysis.capture_parameters?.first_segment_center_freq ?? 0) + (analysis.capture_parameters?.last_segment_center_freq ?? 0)) / 2)}</span>
        <span className="analysis-chip"><b>Receive Power</b> {formatDbmv(receivePowerDbmv)}</span>
        <span className="analysis-chip"><b>RxMER</b> {formatDb(rxMerNumber)}</span>
        <span className="analysis-chip"><b>Avg Power</b> {typeof averagePower === "number" ? `${averagePower.toFixed(2)} dB` : "n/a"}</span>
      </div>
      <div className="status-chip-row spectrum-channel-detail-actions">
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
      <details className="capture-request-dropdown spectrum-math-details">
        <summary className="capture-request-dropdown-summary">Channel Statistics</summary>
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
      </details>
    </div>
  );
}

export function SingleSpectrumOfdmCaptureView({ response }: { response: SingleSpectrumOfdmCaptureResponse }) {
  const [combinedSelection, setCombinedSelection] = useState<SpectrumSelectionRange | null>(null);
  const [combinedZoomDomain, setCombinedZoomDomain] = useState<[number, number] | null>(null);
  const [combinedVisibility, setCombinedVisibility] = useState<Record<string, boolean>>({});
  const [isChannelWaveformPreviewCollapsed, setChannelWaveformPreviewCollapsed] = useState(false);
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

  const previewRows = channels
    .map(({ analysis, channelStats, channelId }, index) => {
      const frequencies = analysis.signal_analysis?.frequencies ?? [];
      const magnitudes = analysis.signal_analysis?.magnitudes ?? [];
      const previewPoints = frequencies
        .slice(0, magnitudes.length)
        .map((frequency, pointIndex) => ({ x: frequency / 1_000_000, y: magnitudes[pointIndex] ?? 0 }));
      const rangeLabel = formatRangeMhz(
        analysis.capture_parameters?.first_segment_center_freq,
        analysis.capture_parameters?.last_segment_center_freq,
      );
      const sortStartHz = analysis.capture_parameters?.first_segment_center_freq ?? Number.POSITIVE_INFINITY;
      const receivePowerDbmv = analysis.signal_analysis?.channel_power_dbmv;
      const rxMerDb = (channelStats as unknown as Record<string, unknown> | undefined)?.docsIf3SignalQualityExtRxMER;
      const rxMerNumber = typeof rxMerDb === "number" ? rxMerDb : undefined;
      return {
        key: `${channelId}-${analysis.capture_parameters?.first_segment_center_freq ?? "na"}`,
        previewLabel: `OFDM channel ${channelId}`,
        previewColor: CHART_SERIES_PALETTE[index % CHART_SERIES_PALETTE_SIZE],
        previewPoints,
        sortStartHz,
        cells: [
          <span className="mono" key="channel-id">{channelId}</span>,
          <span className="mono" key="freq-range">{rangeLabel}</span>,
          <span className="mono" key="receive-power">{formatDbmv(receivePowerDbmv)}</span>,
          <span className="mono" key="rxmer">{formatDb(rxMerNumber)}</span>,
          <span className="mono" key="plc-freq">{formatMhz(channelStats?.docsIf31CmDsOfdmChanPlcFreq)}</span>,
          <span className="mono" key="spacing">{typeof channelStats?.docsIf31CmDsOfdmChanSubcarrierSpacing === "number" ? `${(channelStats.docsIf31CmDsOfdmChanSubcarrierSpacing / 1000).toFixed(0)} kHz` : "n/a"}</span>,
          <span className="mono" key="active-subcarriers">{channelStats?.docsIf31CmDsOfdmChanNumActiveSubcarriers ?? "n/a"}</span>,
        ],
        detail: (
          <SpectrumOfdmChannelDetail
            channelId={channelId}
            analysis={analysis}
            channelStats={channelStats}
          />
        ),
      };
    })
    .sort((left, right) => left.sortStartHz - right.sortStartHz)
    .map((entry) => {
      const { sortStartHz, ...row } = entry;
      void sortStartHz;
      return row;
    });

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
      <Panel
        title={(
          <FoldablePanelTitle
            id="single-spectrum-ofdm-channel-waveform-preview"
            label="Channel Waveform Preview"
            isCollapsed={isChannelWaveformPreviewCollapsed}
            onToggle={() => setChannelWaveformPreviewCollapsed((current) => !current)}
          />
        )}
      >
        <div id="single-spectrum-ofdm-channel-waveform-preview">
          {isChannelWaveformPreviewCollapsed ? null : (
            <SpectrumChannelPreviewTable
              columns={["Channel", "Freq Range", "Receive Power", "RxMER", "PLC Freq", "Spacing", "Active SC"]}
              rows={previewRows}
            />
          )}
        </div>
      </Panel>
    </div>
  );
}
