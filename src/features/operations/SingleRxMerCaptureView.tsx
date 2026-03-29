import { useState } from "react";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { RxMerSelectionInsightsModal, type RxMerSelectionModalState } from "@/components/common/RxMerSelectionInsightsModal";
import { SeriesVisibilityChips } from "@/components/common/SeriesVisibilityChips";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import { ModulationCountsChart } from "@/features/operations/ModulationCountsChart";
import type { ChartSeries } from "@/features/analysis/types";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import { buildExportBaseName } from "@/lib/export/naming";
import { formatFrequencyRangeMhz } from "@/lib/formatters/frequency";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import {
  buildRxMerSelectionInsights,
  collectSelectedRxMerValues,
  collectSelectedRxMerValuesFromSeries,
} from "@/lib/rxMerSelectionInsights";
import { normalizeSpectrumSelection, type SpectrumSelectionRange } from "@/lib/spectrumPower";
import { average, summarize } from "@/lib/stats";
import type { SingleRxMerAnalysisEntry, SingleRxMerCaptureResponse } from "@/types/api";

function toSeries(channel: SingleRxMerAnalysisEntry, color: string, label?: string): ChartSeries {
  const magnitude = channel.carrier_values?.magnitude ?? [];
  const frequency = channel.carrier_values?.frequency ?? [];

  return {
    label: label ?? `Channel ${channel.channel_id ?? "n/a"}`,
    color,
    points: magnitude.map((value, index) => ({
      x: (frequency[index] ?? 0) / 1_000_000,
      y: value,
    })),
  };
}

function findFallbackCaptureTime(analysis: SingleRxMerAnalysisEntry[]): number | undefined {
  return analysis.find((entry) => typeof entry.pnm_header?.capture_time === "number")?.pnm_header?.capture_time;
}

const palette = ["#79a9ff", "#58d0a7", "#ff7a6b", "#f1c75b"] as const;

export function SingleRxMerCaptureView({ response }: { response: SingleRxMerCaptureResponse }) {
  const analysis = response.data?.analysis ?? [];
  const [combinedVisibility, setCombinedVisibility] = useState<Record<string, boolean>>({});
  const [combinedSelection, setCombinedSelection] = useState<SpectrumSelectionRange | null>(null);
  const [combinedZoomDomain, setCombinedZoomDomain] = useState<[number, number] | null>(null);
  const [channelVisibility, setChannelVisibility] = useState<Record<number, Record<string, boolean>>>({});
  const [channelSelection, setChannelSelection] = useState<Record<number, SpectrumSelectionRange | null>>({});
  const [channelZoomDomain, setChannelZoomDomain] = useState<Record<number, [number, number] | null>>({});
  const [selectionInsightsModal, setSelectionInsightsModal] = useState<RxMerSelectionModalState | null>(null);

  if (!analysis.length) {
    return <p className="panel-copy">No RxMER capture data available yet.</p>;
  }

  const primary = analysis[0];
  const fallbackCaptureTime = findFallbackCaptureTime(analysis);
  const fallbackMacAddress = primary?.mac_address ?? response.mac_address;
  const deviceInfo = toDeviceInfo(
    primary?.device_details?.system_description ?? response.system_description,
    primary?.mac_address ?? response.mac_address,
  );
  const combinedSeries = analysis.map((channel, index) => toSeries(channel, palette[index % palette.length]));
  const visibleCombinedSeries = combinedSeries.filter((series) => combinedVisibility[series.label] !== false);
  const normalizedCombinedSelection = normalizeSpectrumSelection(combinedSelection);
  return (
    <div className="operations-visual-stack">
      <div className="status-chip-row">
        <span className="analysis-chip">
          <b>Channels</b> {analysis.length}
        </span>
      </div>

      <DeviceInfoTable deviceInfo={deviceInfo} />

      <SeriesVisibilityChips
        series={combinedSeries}
        visibility={combinedVisibility}
        onToggle={(label) => setCombinedVisibility((current) => ({ ...current, [label]: current[label] === false }))}
      />
      <LineAnalysisChart
        title="All Channels"
        subtitle=""
        yLabel="RxMER (dB)"
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
            showIntegratedPower
            integratedPowerLabel="Selection Insights"
            onIntegratedPowerClick={() => {
              if (!normalizedCombinedSelection) {
                return;
              }
              const selectedValues = collectSelectedRxMerValuesFromSeries(visibleCombinedSeries, normalizedCombinedSelection);
              const insights = buildRxMerSelectionInsights(selectedValues);
              if (!insights) {
                return;
              }
              setSelectionInsightsModal({
                channelId: "All Channels",
                selectionStartMhz: normalizedCombinedSelection.startX,
                selectionEndMhz: normalizedCombinedSelection.endX,
                insights,
              });
            }}
            onApplyZoom={(domain) => setCombinedZoomDomain(domain)}
            onResetZoom={() => setCombinedZoomDomain(null)}
          />
        )}
        exportBaseName={buildExportBaseName(
          fallbackMacAddress,
          fallbackCaptureTime,
          "single-rxmer-all-channels",
        )}
      />

      <div className="analysis-channels-grid">
        {analysis.map((channel, index) => {
          const magnitude = channel.carrier_values?.magnitude ?? [];
          const stats = summarize(magnitude);
          const bits = channel.modulation_statistics?.bits_per_symbol ?? [];
          const channelSeries = [
            toSeries(channel, palette[index % palette.length], "RxMER"),
            {
              label: "Regression",
              color: "#ff7a6b",
              points: (channel.regression?.slope ?? []).map((value, pointIndex) => ({
                x: ((channel.carrier_values?.frequency ?? [])[pointIndex] ?? 0) / 1_000_000,
                y: value,
              })),
            },
          ];
          const perChannelVisibility = channelVisibility[channel.channel_id ?? index] ?? {};
          const visibleChannelSeries = channelSeries.filter((series) => perChannelVisibility[series.label] !== false);
          const channelKey = channel.channel_id ?? index;
          const selection = channelSelection[channelKey] ?? null;
          const zoomDomain = channelZoomDomain[channelKey] ?? null;
          const normalizedSelection = normalizeSpectrumSelection(selection);
          const channelMacAddress = channel.mac_address ?? fallbackMacAddress;
          const channelCaptureTime = channel.pnm_header?.capture_time ?? fallbackCaptureTime;

          return (
            <article key={channel.channel_id ?? index} className="analysis-channel-card">
              <div className="analysis-channel-top">
                <h3 className="analysis-channel-title">Channel {channel.channel_id ?? "n/a"}</h3>
                <div className="analysis-channel-meta-line">
                  <span>{formatFrequencyRangeMhz(channel.carrier_values?.frequency)}</span>
                  <span>{formatEpochSecondsUtc(channel.pnm_header?.capture_time ?? fallbackCaptureTime)}</span>
                </div>
              </div>

              <div className="analysis-channel-body">
                <div className="analysis-small-metrics">
                  <div className="analysis-small-metric">
                    <div className="analysis-small-k">Avg RxMER</div>
                    <div className="analysis-small-v">{stats.avg.toFixed(2)} dB</div>
                  </div>
                  <div className="analysis-small-metric">
                    <div className="analysis-small-k">Min / Max</div>
                    <div className="analysis-small-v">
                      {stats.min.toFixed(2)} / {stats.max.toFixed(2)} dB
                    </div>
                  </div>
                  <div className="analysis-small-metric">
                    <div className="analysis-small-k">Bits / Symbol Avg</div>
                    <div className="analysis-small-v">{bits.length ? average(bits).toFixed(2) : "n/a"}</div>
                  </div>
                </div>

                <SeriesVisibilityChips
                  series={channelSeries}
                  visibility={perChannelVisibility}
                  onToggle={(label) => setChannelVisibility((current) => ({
                    ...current,
                    [channel.channel_id ?? index]: {
                      ...(current[channel.channel_id ?? index] ?? {}),
                      [label]: (current[channel.channel_id ?? index]?.[label] ?? true) === false,
                    },
                  }))}
                />
                <LineAnalysisChart
                  title={`RxMER and Regression (Channel ${channel.channel_id ?? "n/a"})`}
                  subtitle=""
                  yLabel="RxMER (dB)"
                  showLegend={false}
                  series={visibleChannelSeries}
                  xDomain={zoomDomain ?? undefined}
                  enableRangeSelection
                  selection={selection}
                  onSelectionChange={(nextSelection) => setChannelSelection((current) => ({
                    ...current,
                    [channelKey]: nextSelection,
                  }))}
                  selectionActions={(
                    <SpectrumSelectionActions
                      selection={selection}
                      hasZoomDomain={zoomDomain !== null}
                      showIntegratedPower
                      integratedPowerLabel="Selection Insights"
                      onIntegratedPowerClick={() => {
                        if (!normalizedSelection) {
                          return;
                        }
                        const selectedValues = collectSelectedRxMerValues(
                          channel.carrier_values?.frequency,
                          channel.carrier_values?.magnitude,
                          normalizedSelection,
                        );
                        const insights = buildRxMerSelectionInsights(selectedValues);
                        if (!insights) {
                          return;
                        }
                        setSelectionInsightsModal({
                          channelId: String(channel.channel_id ?? "n/a"),
                          selectionStartMhz: normalizedSelection.startX,
                          selectionEndMhz: normalizedSelection.endX,
                          insights,
                        });
                      }}
                      onApplyZoom={(domain) => setChannelZoomDomain((current) => ({
                        ...current,
                        [channelKey]: domain,
                      }))}
                      onResetZoom={() => setChannelZoomDomain((current) => ({
                        ...current,
                        [channelKey]: null,
                      }))}
                    />
                  )}
                  exportBaseName={buildExportBaseName(
                    channelMacAddress,
                    channelCaptureTime,
                    `single-rxmer-channel-${channel.channel_id ?? index}`,
                  )}
                />

                <ModulationCountsChart
                  title={`Supported Modulation Counts (Channel ${channel.channel_id ?? "n/a"})`}
                  counts={channel.modulation_statistics?.supported_modulation_counts}
                  exportBaseName={buildExportBaseName(
                    channelMacAddress,
                    channelCaptureTime,
                    `single-rxmer-modulation-counts-channel-${channel.channel_id ?? index}`,
                  )}
                />
              </div>
            </article>
          );
        })}
      </div>

      <RxMerSelectionInsightsModal
        data={selectionInsightsModal}
        exportBaseName={buildExportBaseName(
          fallbackMacAddress,
          fallbackCaptureTime,
          selectionInsightsModal
            ? `single-rxmer-selection-distribution-channel-${selectionInsightsModal.channelId}`
            : "single-rxmer-selection-distribution",
        )}
        onClose={() => setSelectionInsightsModal(null)}
      />
    </div>
  );
}
