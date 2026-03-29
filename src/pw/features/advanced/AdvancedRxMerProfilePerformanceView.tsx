import { useState } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { RxMerSelectionInsightsModal, type RxMerSelectionModalState } from "@/components/common/RxMerSelectionInsightsModal";
import { SeriesVisibilityChips } from "@/components/common/SeriesVisibilityChips";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { SpectrumSelectionSummary } from "@/components/common/SpectrumSelectionSummary";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import { downloadCsv } from "@/lib/export/csv";
import { buildExportBaseName } from "@/lib/export/naming";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import { buildRxMerSelectionInsights, collectSelectedRxMerValues } from "@/lib/rxMerSelectionInsights";
import { normalizeSpectrumSelection, type SpectrumSelectionRange } from "@/lib/spectrumPower";
import type { ChartSeries } from "@/pw/features/analysis/types";
import type { AdvancedMultiRxMerAnalysisResponse, AdvancedMultiRxMerOfdmProfileChannel } from "@/types/api";

function buildChannelSeries(channel: AdvancedMultiRxMerOfdmProfileChannel): ChartSeries[] {
  const frequency = channel.frequency ?? [];
  const avgMer = channel.avg_mer ?? [];
  const shannonLimits = channel.mer_shannon_limits ?? [];
  const series: ChartSeries[] = [
    {
      label: "Avg MER",
      color: "#79a9ff",
      points: frequency.slice(0, avgMer.length).map((value, index) => ({ x: value / 1_000_000, y: avgMer[index] ?? 0 })),
    },
    {
      label: "Shannon Limit",
      color: "#58d0a7",
      points: frequency.slice(0, shannonLimits.length).map((value, index) => ({ x: value / 1_000_000, y: shannonLimits[index] ?? 0 })),
    },
  ];

  const profileColors = ["#ef4444", "#f59e0b", "#a78bfa", "#22c55e", "#e879f9"];
  (channel.profiles ?? []).forEach((profile, index) => {
    const profileId = Number((profile as { profile_id?: number }).profile_id ?? index);
    const values = ((profile as { profile_min_mer?: number[] }).profile_min_mer ?? []);
    series.push({
      label: `Profile ${profileId}`,
      color: profileColors[index % profileColors.length],
      points: frequency.slice(0, values.length).map((value, pointIndex) => ({ x: value / 1_000_000, y: values[pointIndex] ?? 0 })),
    });
  });

  return series;
}

function formatCaptureTime(epoch: unknown): string {
  const value = Number(epoch);
  if (!Number.isFinite(value)) return "n/a";
  return new Date(value * 1000).toISOString().replace("T", " ").replace(".000Z", " UTC");
}

export function AdvancedRxMerProfilePerformanceView({ response }: { response: AdvancedMultiRxMerAnalysisResponse }) {
  const channels = Object.entries(response.data ?? {}) as Array<[string, AdvancedMultiRxMerOfdmProfileChannel]>;
  const macAddress = response.device?.mac_address ?? response.mac_address;
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />
      {channels.map(([channelId, channel]) => {
        const profiles = channel.profiles ?? [];
        return (
          <ProfilePerformanceChannelPanel
            key={channelId}
            channelId={channelId}
            channel={channel}
            profiles={profiles}
            macAddress={macAddress}
          />
        );
      })}
    </div>
  );
}

function ProfilePerformanceChannelPanel({
  channelId,
  channel,
  profiles,
  macAddress,
}: {
  channelId: string;
  channel: AdvancedMultiRxMerOfdmProfileChannel;
  profiles: Array<Record<string, unknown>>;
  macAddress: string | undefined;
}) {
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({});
  const [selection, setSelection] = useState<SpectrumSelectionRange | null>(null);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [selectionInsightsModal, setSelectionInsightsModal] = useState<RxMerSelectionModalState | null>(null);
  const allSeries = buildChannelSeries(channel);
  const visibleSeries = allSeries.filter((item) => seriesVisibility[item.label] !== false);
  const captureTime = Number((profiles[0] as { capture_time?: number } | undefined)?.capture_time);
  const normalizedSelection = normalizeSpectrumSelection(selection);

  return (
    <Panel title={`Channel ${channelId} · OFDM Profile Performance 1`}>
      <SeriesVisibilityChips
        series={allSeries}
        visibility={seriesVisibility}
        onToggle={(label) => {
          setSeriesVisibility((current) => ({ ...current, [label]: current[label] === false }));
        }}
      />
      <LineAnalysisChart
        title={`Avg MER vs Profiles · Channel ${channelId}`}
        subtitle={`Profiles: ${profiles.length}`}
        yLabel="MER (dB)"
        series={visibleSeries}
        showLegend={false}
        enableRangeSelection
        selection={selection}
        onSelectionChange={setSelection}
        xDomain={zoomDomain ?? undefined}
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
                channel.frequency,
                channel.avg_mer,
                normalizedSelection,
              );
              const insights = buildRxMerSelectionInsights(selectedValues);
              if (!insights) {
                return;
              }
              setSelectionInsightsModal({
                channelId,
                selectionStartMhz: normalizedSelection.startX,
                selectionEndMhz: normalizedSelection.endX,
                insights,
              });
            }}
            onApplyZoom={(domain) => {
              setZoomDomain(domain);
              setSelection(null);
            }}
            onResetZoom={() => {
              setZoomDomain(null);
              setSelection(null);
            }}
          />
        )}
        exportBaseName={buildExportBaseName(
          macAddress,
          captureTime,
          `advanced-rxmer-profile-performance-channel-${channelId}`,
        )}
      />
      <div className="operations-visual-actions">
        <ExportActions
          onCsv={() => downloadCsv(
            buildExportBaseName(
              macAddress,
              captureTime,
              `advanced-rxmer-profile-performance-channel-${channelId}-table`,
            ),
            profiles.map((profile, index) => {
              const entry = profile as {
                capture_time?: number;
                profile_id?: number;
                capacity_delta?: number[];
                fec_summary?: {
                  summary?: Array<{ summary?: { total_codewords?: number; corrected?: number; uncorrectable?: number } }>;
                  total_codewords?: number;
                  corrected?: number;
                  uncorrectable?: number;
                };
              };
              const capacity = entry.capacity_delta ?? [];
              const summary = entry.fec_summary?.summary?.[0]?.summary ?? entry.fec_summary;
              return {
                profile_id: entry.profile_id ?? index,
                capture_time_utc: formatCaptureTime(entry.capture_time),
                capacity_delta_min: capacity.length ? Math.min(...capacity).toFixed(2) : "n/a",
                capacity_delta_avg: capacity.length ? (capacity.reduce((sum, value) => sum + value, 0) / capacity.length).toFixed(2) : "n/a",
                capacity_delta_max: capacity.length ? Math.max(...capacity).toFixed(2) : "n/a",
                total_codewords: summary?.total_codewords ?? "n/a",
                corrected: summary?.corrected ?? "n/a",
                uncorrectable: summary?.uncorrectable ?? "n/a",
              };
            }),
          )}
        />
      </div>
      <SpectrumSelectionSummary
        selection={selection}
        integratedPower={[]}
        emptyMessage="Drag across the profile chart to select a frequency range for zoom."
      />
      <RxMerSelectionInsightsModal
        data={selectionInsightsModal}
        exportBaseName={buildExportBaseName(
          macAddress,
          captureTime,
          `advanced-rxmer-profile-performance-selection-distribution-channel-${channelId}`,
        )}
        onClose={() => setSelectionInsightsModal(null)}
      />
      <div className="table-scroll">
        <table className="channel-metrics-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Capture Time</th>
              <th>Capacity Δ Min</th>
              <th>Capacity Δ Avg</th>
              <th>Capacity Δ Max</th>
              <th>Total CW</th>
              <th>Corrected</th>
              <th>Uncorrectable</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile, index) => {
              const entry = profile as {
                capture_time?: number;
                profile_id?: number;
                capacity_delta?: number[];
                fec_summary?: {
                  summary?: Array<{ summary?: { total_codewords?: number; corrected?: number; uncorrectable?: number } }>;
                  total_codewords?: number;
                  corrected?: number;
                  uncorrectable?: number;
                };
              };
              const capacity = entry.capacity_delta ?? [];
              const summary = entry.fec_summary?.summary?.[0]?.summary ?? entry.fec_summary;
              return (
                <tr key={index}>
                  <td className="mono">{entry.profile_id ?? index}</td>
                  <td className="mono">{formatCaptureTime(entry.capture_time)}</td>
                  <td className="mono">{capacity.length ? Math.min(...capacity).toFixed(2) : "n/a"}</td>
                  <td className="mono">{capacity.length ? (capacity.reduce((sum, value) => sum + value, 0) / capacity.length).toFixed(2) : "n/a"}</td>
                  <td className="mono">{capacity.length ? Math.max(...capacity).toFixed(2) : "n/a"}</td>
                  <td className="mono">{summary?.total_codewords?.toLocaleString?.() ?? summary?.total_codewords ?? "n/a"}</td>
                  <td className="mono">{summary?.corrected?.toLocaleString?.() ?? summary?.corrected ?? "n/a"}</td>
                  <td className="mono">{summary?.uncorrectable?.toLocaleString?.() ?? summary?.uncorrectable ?? "n/a"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
