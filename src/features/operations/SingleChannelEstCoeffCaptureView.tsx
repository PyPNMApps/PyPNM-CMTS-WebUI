import { ExportActions } from "@/components/common/ExportActions";
import { useState } from "react";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { SeriesVisibilityChips } from "@/components/common/SeriesVisibilityChips";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import type { ChartSeries } from "@/features/analysis/types";
import { downloadCsv } from "@/lib/export/csv";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import { formatFrequencyRangeMhz } from "@/lib/formatters/frequency";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";
import type {
  SingleChannelEstCoeffAnalysisEntry,
  SingleChannelEstCoeffCaptureResponse,
  SingleChannelEstCoeffPrimitiveEntry,
} from "@/types/api";

import { IqScatterChart } from "./IqScatterChart";

function formatFixed(value: number | undefined, digits: number): string {
  return typeof value === "number" ? value.toFixed(digits) : "n/a";
}

function toSeries(label: string, color: string, frequency: number[], values: number[]): ChartSeries {
  return {
    label,
    color,
    points: values.map((value, index) => ({
      x: (frequency[index] ?? 0) / 1_000_000,
      y: value,
    })),
  };
}

function findPrimitive(primitives: SingleChannelEstCoeffPrimitiveEntry[] | undefined, channelId: number | undefined) {
  return (primitives ?? []).find((entry) => entry.channel_id === channelId);
}

function captureTime(analysis: SingleChannelEstCoeffAnalysisEntry[]): string {
  return formatEpochSecondsUtc(analysis.find((entry) => typeof entry.pnm_header?.capture_time === "number")?.pnm_header?.capture_time);
}

function fallbackCaptureTime(analysis: SingleChannelEstCoeffAnalysisEntry[]): number | undefined {
  return analysis.find((entry) => typeof entry.pnm_header?.capture_time === "number")?.pnm_header?.capture_time;
}

const palette = ["#79a9ff", "#58d0a7", "#ff7a6b", "#f1c75b"] as const;

export function SingleChannelEstCoeffCaptureView({ response }: { response: SingleChannelEstCoeffCaptureResponse }) {
  const analysis = response.data?.analysis ?? [];
  const [combinedVisibility, setCombinedVisibility] = useState<Record<string, boolean>>({});
  const [combinedSelection, setCombinedSelection] = useState<SpectrumSelectionRange | null>(null);
  const [combinedZoomDomain, setCombinedZoomDomain] = useState<[number, number] | null>(null);
  const [channelMagnitudeSelection, setChannelMagnitudeSelection] = useState<Record<number, SpectrumSelectionRange | null>>({});
  const [channelMagnitudeZoomDomain, setChannelMagnitudeZoomDomain] = useState<Record<number, [number, number] | null>>({});
  const [channelDelaySelection, setChannelDelaySelection] = useState<Record<number, SpectrumSelectionRange | null>>({});
  const [channelDelayZoomDomain, setChannelDelayZoomDomain] = useState<Record<number, [number, number] | null>>({});

  if (!analysis.length) {
    return <p className="panel-copy">No channel-est capture data available yet.</p>;
  }

  const primary = analysis[0];
  const deviceInfo = toDeviceInfo(primary?.device_details?.system_description ?? response.system_description, primary?.mac_address ?? response.mac_address);
  const magnitudeSeries = analysis.map((channel, index) =>
    toSeries(`Channel ${channel.channel_id ?? "n/a"}`, palette[index % palette.length], channel.carrier_values.frequency, channel.carrier_values.magnitudes),
  );
  const visibleMagnitudeSeries = magnitudeSeries.filter((series) => combinedVisibility[series.label] !== false);
  const captureTimeLabel = captureTime(analysis);
  const fallbackChannelCaptureTime = fallbackCaptureTime(analysis);

  return (
    <div className="operations-visual-stack">
      <div className="status-chip-row">
        <span className="analysis-chip">
          <b>Channels</b> {analysis.length}
        </span>
        <span className="analysis-chip">
          <b>Capture Time</b> {captureTimeLabel}
        </span>
      </div>

      <DeviceInfoTable deviceInfo={deviceInfo} />

      <SeriesVisibilityChips
        series={magnitudeSeries}
        visibility={combinedVisibility}
        onToggle={(label) => setCombinedVisibility((current) => ({ ...current, [label]: current[label] === false }))}
      />
      <LineAnalysisChart
        title="All Channels Magnitude Response"
        subtitle=""
        yLabel="Magnitude (dB)"
        showLegend={false}
        series={visibleMagnitudeSeries}
        xDomain={combinedZoomDomain ?? undefined}
        enableRangeSelection
        selection={combinedSelection}
        onSelectionChange={setCombinedSelection}
        selectionActions={(
          <SpectrumSelectionActions
            selection={combinedSelection}
            hasZoomDomain={combinedZoomDomain !== null}
            showIntegratedPower={false}
            onApplyZoom={(domain) => setCombinedZoomDomain(domain)}
            onResetZoom={() => setCombinedZoomDomain(null)}
          />
        )}
        exportBaseName="single-channel-estimation-all-channels"
      />

      <div className="analysis-channels-grid">
        {analysis.map((channel, index) => {
          const primitive = findPrimitive(response.data?.primative, channel.channel_id);
          const echoes = channel.echo?.report?.echoes ?? [];
          const channelKey = channel.channel_id ?? index;
          const magnitudeSelection = channelMagnitudeSelection[channelKey] ?? null;
          const magnitudeZoomDomain = channelMagnitudeZoomDomain[channelKey] ?? null;
          const delaySelection = channelDelaySelection[channelKey] ?? null;
          const delayZoomDomain = channelDelayZoomDomain[channelKey] ?? null;

          return (
            <article key={channel.channel_id ?? index} className="analysis-channel-card">
              <div className="analysis-channel-top">
                <div className="analysis-channel-meta-line analysis-channel-meta-line-header">
                  <h3 className="analysis-channel-title">Channel {channel.channel_id ?? "n/a"}</h3>
                  <span className="analysis-channel-header-value">{formatFrequencyRangeMhz(channel.carrier_values.frequency)}</span>
                  <span className="analysis-channel-header-value">{formatEpochSecondsUtc(channel.pnm_header?.capture_time ?? fallbackChannelCaptureTime)}</span>
                </div>
              </div>

              <div className="status-chip-row channel-est-chip-row">
                <span className="analysis-chip">
                  <b>Center Frequency</b>{" "}
                  {Math.round((((channel.carrier_values.frequency[0] ?? 0) + (channel.carrier_values.frequency[channel.carrier_values.frequency.length - 1] ?? 0)) / 2) / 1_000_000)} MHz
                </span>
                <span className="analysis-chip">
                  <b>Channel Width</b> {primitive ? (primitive.occupied_channel_bandwidth ?? 0) / 1_000_000 : "n/a"} MHz
                </span>
                <span className="analysis-chip">
                  <b>Carrier Count</b> {channel.carrier_values.carrier_count ?? "n/a"}
                </span>
                <span className="analysis-chip">
                  <b>Subcarrier Spacing</b> {primitive ? `${Math.round((primitive.subcarrier_spacing ?? 0) / 1000)} kHz` : "n/a"}
                </span>
              </div>

              <div className="channel-est-stack">
                <div className="channel-est-panel">
                  <IqScatterChart
                    title="I/Q Equalizer Scatter Plot"
                    points={primitive?.values ?? []}
                    exportBaseName={`single-channel-estimation-iq-scatter-channel-${channel.channel_id ?? index}`}
                  />
                </div>
                <div className="channel-est-panel">
                  <LineAnalysisChart
                    title="Channel Estimation - Magnitude Response (dB)"
                    subtitle=""
                    yLabel="Magnitude (dB)"
                    series={[toSeries("Magnitude", palette[index % palette.length], channel.carrier_values.frequency, channel.carrier_values.magnitudes)]}
                    xDomain={magnitudeZoomDomain ?? undefined}
                    enableRangeSelection
                    selection={magnitudeSelection}
                    onSelectionChange={(nextSelection) => setChannelMagnitudeSelection((current) => ({
                      ...current,
                      [channelKey]: nextSelection,
                    }))}
                    selectionActions={(
                      <SpectrumSelectionActions
                        selection={magnitudeSelection}
                        hasZoomDomain={magnitudeZoomDomain !== null}
                        showIntegratedPower={false}
                        onApplyZoom={(domain) => setChannelMagnitudeZoomDomain((current) => ({
                          ...current,
                          [channelKey]: domain,
                        }))}
                        onResetZoom={() => setChannelMagnitudeZoomDomain((current) => ({
                          ...current,
                          [channelKey]: null,
                        }))}
                      />
                    )}
                    exportBaseName={`single-channel-estimation-magnitude-channel-${channel.channel_id ?? index}`}
                  />
                </div>
                <div className="channel-est-panel">
                  <LineAnalysisChart
                    title="Channel Estimation - Group Delay"
                    subtitle=""
                    yLabel="Group Delay"
                    series={[
                      toSeries("Group Delay", "#58d0a7", channel.carrier_values.frequency, channel.carrier_values.group_delay?.magnitude ?? []),
                    ]}
                    xDomain={delayZoomDomain ?? undefined}
                    enableRangeSelection
                    selection={delaySelection}
                    onSelectionChange={(nextSelection) => setChannelDelaySelection((current) => ({
                      ...current,
                      [channelKey]: nextSelection,
                    }))}
                    selectionActions={(
                      <SpectrumSelectionActions
                        selection={delaySelection}
                        hasZoomDomain={delayZoomDomain !== null}
                        showIntegratedPower={false}
                        onApplyZoom={(domain) => setChannelDelayZoomDomain((current) => ({
                          ...current,
                          [channelKey]: domain,
                        }))}
                        onResetZoom={() => setChannelDelayZoomDomain((current) => ({
                          ...current,
                          [channelKey]: null,
                        }))}
                      />
                    )}
                    exportBaseName={`single-channel-estimation-group-delay-channel-${channel.channel_id ?? index}`}
                  />
                </div>
              </div>

              <div className="channel-est-echo-block">
                <div className="analysis-channel-meta-line">
                  <span>Cable Type: {channel.echo?.report?.cable_type ?? "n/a"}</span>
                  <span>Velocity Factor: {String(channel.echo?.report?.velocity_factor ?? "n/a")}</span>
                  <span>Propagation Speed: {formatFixed(channel.echo?.report?.prop_speed_mps, 2)} m/s</span>
                </div>
                {echoes.length ? (
                  <>
                    <div className="operations-visual-actions">
                      <ExportActions
                        onCsv={() => downloadCsv(
                          `single-channel-estimation-echoes-channel-${channel.channel_id ?? index}`,
                          echoes.map((echo, echoIndex) => ({
                            echo_rank: echoIndex + 1,
                            time_us: (echo.time_s * 1_000_000).toFixed(3),
                            amplitude: echo.amplitude.toFixed(6),
                            distance_m: echo.distance_m.toFixed(2),
                            distance_ft: echo.distance_ft.toFixed(2),
                          })),
                        )}
                      />
                    </div>
                    <table className="analysis-echo-table">
                      <thead>
                        <tr>
                          <th>Echo #</th>
                          <th>Time (us)</th>
                          <th>Amplitude</th>
                          <th>Distance (m)</th>
                          <th>Distance (ft)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {echoes.map((echo, echoIndex) => (
                          <tr key={`${channel.channel_id ?? index}-${echoIndex}`}>
                            <td>{echoIndex + 1}</td>
                            <td>{(echo.time_s * 1_000_000).toFixed(3)}</td>
                            <td>{echo.amplitude.toFixed(6)}</td>
                            <td>{echo.distance_m.toFixed(2)}</td>
                            <td>{echo.distance_ft.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <p className="panel-copy">No significant echoes detected.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
