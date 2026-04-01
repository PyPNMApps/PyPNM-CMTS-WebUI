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

function formatDbmv(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)} dBmV` : "n/a";
}

function formatDb(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)} dB` : "n/a";
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

function SpectrumScqamChannelDetail({
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
  const receivePowerDbmv = analysis.signal_analysis?.channel_power_dbmv ?? channelStats?.docsIfDownChannelPower;
  const rxMerDb = channelStats?.docsIf3SignalQualityExtRxMER;

  return (
    <div className="spectrum-channel-detail-card">
      <div className="status-chip-row">
        <span className="analysis-chip"><b>Freq</b> {formatMhz(channelStats?.docsIfDownChannelFrequency)}</span>
        <span className="analysis-chip"><b>Width</b> {formatMhz(channelStats?.docsIfDownChannelWidth)}</span>
        <span className="analysis-chip"><b>Receive Power</b> {formatDbmv(receivePowerDbmv)}</span>
        <span className="analysis-chip"><b>RxMER</b> {formatDb(rxMerDb)}</span>
      </div>
      <div className="status-chip-row spectrum-channel-detail-actions">
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
      <details className="capture-request-dropdown spectrum-math-details">
        <summary className="capture-request-dropdown-summary">Math & Metrics</summary>
        <SpectrumSelectionSummary selection={selection} integratedPower={integratedPower} />
        <table className="channel-metrics-table">
          <tbody>
            <tr><th>Receive Power</th><td className="mono">{formatDbmv(receivePowerDbmv)}</td></tr>
            <tr><th>RxMER</th><td className="mono">{formatDb(rxMerDb)}</td></tr>
            <tr><th>Microreflections</th><td className="mono">{formatNumber(channelStats?.docsIfSigQMicroreflections)}</td></tr>
            <tr><th>Modulation</th><td className="mono">{channelStats?.docsIfDownChannelModulation ?? "n/a"}</td></tr>
            <tr><th>Interleave</th><td className="mono">{channelStats?.docsIfDownChannelInterleave ?? "n/a"}</td></tr>
            <tr><th>Min / Max</th><td className="mono">{findMinMax(magnitudes)}</td></tr>
          </tbody>
        </table>
        <div className="table-scroll">
          <table className="channel-metrics-table">
            <thead>
              <tr>
                <th>FEC Group</th>
                <th>Unerrored</th>
                <th>Corrected</th>
                <th>Uncorrectable</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Primary FEC</td>
                <td className="mono">{formatNumber(channelStats?.docsIfSigQUnerroreds)}</td>
                <td className="mono">{formatNumber(channelStats?.docsIfSigQCorrecteds)}</td>
                <td className="mono">{formatNumber(channelStats?.docsIfSigQUncorrectables)}</td>
              </tr>
              <tr>
                <td>Extended FEC</td>
                <td className="mono">{formatNumber(channelStats?.docsIfSigQExtUnerroreds)}</td>
                <td className="mono">{formatNumber(channelStats?.docsIfSigQExtCorrecteds)}</td>
                <td className="mono">{formatNumber(channelStats?.docsIfSigQExtUncorrectables)}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
      </details>
    </div>
  );
}

export function SingleSpectrumScqamCaptureView({ response }: { response: SingleSpectrumScqamCaptureResponse }) {
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
      const captureCenterHz = ((analysis.capture_parameters?.first_segment_center_freq ?? 0) + (analysis.capture_parameters?.last_segment_center_freq ?? 0)) / 2;
      const sortStartHz = analysis.capture_parameters?.first_segment_center_freq ?? Number.POSITIVE_INFINITY;
      const receivePowerDbmv = analysis.signal_analysis?.channel_power_dbmv ?? channelStats?.docsIfDownChannelPower;
      const rxMerDb = channelStats?.docsIf3SignalQualityExtRxMER;
      return {
        key: `${channelId}-${analysis.capture_parameters?.first_segment_center_freq ?? "na"}`,
        previewLabel: `SCQAM channel ${channelId}`,
        previewColor: ["#79a9ff", "#58d0a7", "#f59e0b", "#ef4444", "#a78bfa"][index % 5],
        previewPoints,
        sortStartHz,
        cells: [
          <span className="mono" key="channel-id">{channelId}</span>,
          <span className="mono" key="freq-range">{rangeLabel}</span>,
          <span className="mono" key="center">{formatMhz(captureCenterHz)}</span>,
          <span className="mono" key="receive-power">{formatDbmv(receivePowerDbmv)}</span>,
          <span className="mono" key="rxmer">{formatDb(rxMerDb)}</span>,
          <span className="mono" key="modulation">{channelStats?.docsIfDownChannelModulation ?? "n/a"}</span>,
        ],
        detail: (
          <SpectrumScqamChannelDetail
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
      <Panel
        title={(
          <FoldablePanelTitle
            id="single-spectrum-scqam-channel-waveform-preview"
            label="Channel Waveform Preview"
            isCollapsed={isChannelWaveformPreviewCollapsed}
            onToggle={() => setChannelWaveformPreviewCollapsed((current) => !current)}
          />
        )}
      >
        <div id="single-spectrum-scqam-channel-waveform-preview">
          {isChannelWaveformPreviewCollapsed ? null : (
            <SpectrumChannelPreviewTable
              columns={["Channel", "Freq Range", "Center", "Receive Power", "RxMER", "Modulation"]}
              rows={previewRows}
            />
          )}
        </div>
      </Panel>
    </div>
  );
}
