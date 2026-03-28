import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { SeriesVisibilityChips } from "@/components/common/SeriesVisibilityChips";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { ChartSeries } from "@/features/analysis/types";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";
import type { SingleUsOfdmaPreEqualizationAnalysisEntry, SingleUsOfdmaPreEqualizationCaptureResponse } from "@/types/api";
import { useState } from "react";

function asNumber(value: number | string | undefined | null): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fmt(value: number | null, digits = 3, suffix = ""): string {
  return value === null ? "n/a" : `${value.toFixed(digits)}${suffix}`;
}

function mhz(value: number | null, digits = 3): string {
  return value === null ? "n/a" : `${(value / 1_000_000).toFixed(digits)} MHz`;
}

function buildSeriesVersionLabel(version: number | undefined): string {
  if (version === 6) return "Upstream Pre-Equalizer Coefficients";
  if (version === 7) return "Upstream Pre-Equalizer Coefficients (Last Update)";
  return `Version ${version ?? "n/a"}`;
}

function buildLineSeries(
  entries: SingleUsOfdmaPreEqualizationAnalysisEntry[],
  accessor: (entry: SingleUsOfdmaPreEqualizationAnalysisEntry) => number[] | undefined,
  palette: string[],
): ChartSeries[] {
  return entries.map((entry, index) => {
    const frequency = entry.carrier_values?.frequency ?? [];
    const values = accessor(entry) ?? [];
    return {
      label: buildSeriesVersionLabel(entry.pnm_header?.file_type_version),
      color: palette[index % palette.length],
      points: frequency.slice(0, values.length).map((x, pointIndex) => ({ x: x / 1_000_000, y: values[pointIndex] ?? 0 })),
    };
  });
}

function hasPopulatedDeviceInfo(deviceInfo: ReturnType<typeof toDeviceInfo>) {
  return [deviceInfo.macAddress, deviceInfo.MODEL, deviceInfo.VENDOR, deviceInfo.SW_REV, deviceInfo.HW_REV, deviceInfo.BOOTR]
    .some((value) => value && value !== "n/a");
}

export function SingleUsOfdmaPreEqualizationView({ response }: { response: SingleUsOfdmaPreEqualizationCaptureResponse }) {
  const analysis = response.data?.analysis ?? [];
  const channelsMap = new Map<number, SingleUsOfdmaPreEqualizationAnalysisEntry[]>();

  analysis.forEach((entry) => {
    const channelId = entry.channel_id;
    if (typeof channelId !== "number") return;
    const existing = channelsMap.get(channelId) ?? [];
    existing.push(entry);
    existing.sort((left, right) => (left.pnm_header?.file_type_version ?? 0) - (right.pnm_header?.file_type_version ?? 0));
    channelsMap.set(channelId, existing);
  });

  const channels = Array.from(channelsMap.entries())
    .map(([channelId, entries]) => {
      const primaryEntries = entries.filter((entry) => (entry.pnm_header?.file_type_version ?? 6) !== 7);
      return [channelId, primaryEntries.length ? primaryEntries : entries] as const;
    })
    .sort((a, b) => a[0] - b[0]);
  const captureTime = analysis.find((entry) => entry.pnm_header?.capture_time)?.pnm_header?.capture_time;
  const fallbackEntry = analysis.find((entry) => {
    const info = toDeviceInfo(entry.device_details?.system_description, entry.mac_address);
    return hasPopulatedDeviceInfo(info);
  });
  const analysisDeviceInfo = fallbackEntry
    ? toDeviceInfo(fallbackEntry.device_details?.system_description, fallbackEntry.mac_address)
    : null;
  const baseDeviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const deviceInfo = analysisDeviceInfo ?? baseDeviceInfo;
  const combinedMagnitudeSeries = channels.map(([channelId, entries], index) => {
    const entry = entries[0];
    const frequency = entry?.carrier_values?.frequency ?? [];
    const magnitudes = entry?.carrier_values?.magnitudes ?? [];
    const palette = ["#4fc3f7", "#ff6c37", "#58d0a7", "#f59e0b", "#a78bfa", "#ef4444"];
    return {
      label: `Channel ${channelId}`,
      color: palette[index % palette.length],
      points: frequency.slice(0, magnitudes.length).map((x, pointIndex) => ({ x: x / 1_000_000, y: magnitudes[pointIndex] ?? 0 })),
    };
  }).filter((series) => series.points.length);
  const [channelLineVisibility, setChannelLineVisibility] = useState<Record<number, { estimated: boolean; preEq: boolean }>>({});
  const [channelSeriesVisibility, setChannelSeriesVisibility] = useState<Record<number, Record<string, boolean>>>({});
  const [groupDelaySeriesVisibility, setGroupDelaySeriesVisibility] = useState<Record<number, Record<string, boolean>>>({});
  const [combinedSelection, setCombinedSelection] = useState<SpectrumSelectionRange | null>(null);
  const [combinedZoomDomain, setCombinedZoomDomain] = useState<[number, number] | null>(null);
  const [frequencySelection, setFrequencySelection] = useState<Record<number, SpectrumSelectionRange | null>>({});
  const [frequencyZoomDomain, setFrequencyZoomDomain] = useState<Record<number, [number, number] | null>>({});
  const [groupDelaySelection, setGroupDelaySelection] = useState<Record<number, SpectrumSelectionRange | null>>({});
  const [groupDelayZoomDomain, setGroupDelayZoomDomain] = useState<Record<number, [number, number] | null>>({});

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>Status</b> {String(response.status ?? "n/a")}</span>
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Capture Time</b> {captureTime ?? "n/a"}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      {combinedMagnitudeSeries.length ? (
        <Panel title="Combined Pre-EQ Magnitude Response">
          <LineAnalysisChart
            title="All Channels"
            subtitle="Primary OFDMA pre-equalization captures only"
            yLabel="dB"
            series={combinedMagnitudeSeries}
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
            exportBaseName="single-us-ofdma-pre-eq-all-channels"
          />
        </Panel>
      ) : null}

      <div className="if31-ds-ofdm-channel-grid">
        {channels.map(([channelId, entries]) => {
          const firstEntry = entries[0];
          const zeroFreq = asNumber(firstEntry?.subcarrier_zero_frequency);
          const spacing = asNumber(firstEntry?.subcarrier_spacing);
          const firstActive = asNumber(firstEntry?.first_active_subcarrier_index);
          const lineVisibility = channelLineVisibility[channelId] ?? { estimated: true, preEq: true };
          const combinedChannelSeries = [
            ...(lineVisibility.estimated
              ? buildLineSeries(
                entries,
                (entry) => entry.carrier_values?.chan_est?.length ? entry.carrier_values.chan_est : entry.carrier_values?.channel_estimate_magnitude_db,
                ["#ef4444", "#22c55e"],
              ).map((series) => ({ ...series, label: `${series.label} · Estimated` }))
              : []),
            ...(lineVisibility.preEq
              ? buildLineSeries(entries, (entry) => entry.carrier_values?.magnitudes, ["#4fc3f7", "#ff6c37"])
                .map((series) => ({ ...series, label: `${series.label} · Pre-EQ` }))
              : []),
          ];
          const seriesVisibility = channelSeriesVisibility[channelId] ?? {};
          const visibleChannelSeries = combinedChannelSeries.filter((series) => seriesVisibility[series.label] !== false);
          const groupDelaySeries = buildLineSeries(entries, (entry) => entry.carrier_values?.group_delay?.magnitude, ["#58d0a7", "#f59e0b"]);
          const visibleGroupDelay = groupDelaySeries.filter((series) => (groupDelaySeriesVisibility[channelId] ?? {})[series.label] !== false);
          const selectedFrequencyRange = frequencySelection[channelId] ?? null;
          const selectedFrequencyZoom = frequencyZoomDomain[channelId] ?? null;
          const selectedGroupDelayRange = groupDelaySelection[channelId] ?? null;
          const selectedGroupDelayZoom = groupDelayZoomDomain[channelId] ?? null;

          return (
            <Panel key={`us-ofdma-preeq-${channelId}`} title={`Channel ${channelId}`}>
              <div className="status-chip-row">
                <span className="analysis-chip"><b>Zero Freq</b> {mhz(zeroFreq)}</span>
                <span className="analysis-chip"><b>Spacing</b> {spacing === null ? "n/a" : `${spacing.toLocaleString()} Hz`}</span>
                <span className="analysis-chip"><b>First Active</b> {firstActive === null ? "n/a" : Math.trunc(firstActive)}</span>
                <span className="analysis-chip"><b>Series</b> {entries.length}</span>
              </div>

              <Panel title="Series Summary">
                <table className="channel-metrics-table us-ofdma-preeq-summary-table">
                  <thead>
                    <tr>
                      <th>Series</th>
                      <th>Mean</th>
                      <th>Median</th>
                      <th>Std Dev</th>
                      <th>Power</th>
                      <th>Peak-to-Peak</th>
                      <th>Crest Factor</th>
                      <th>Echoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => {
                      const stats = entry.signal_statistics;
                      const echoes = entry.echo?.report?.echoes ?? [];
                      return (
                        <tr key={`${channelId}-${entry.pnm_header?.file_type_version ?? index}`}>
                          <td>{buildSeriesVersionLabel(entry.pnm_header?.file_type_version)}</td>
                          <td className="mono">{fmt(asNumber(stats?.mean), 3, " dB")}</td>
                          <td className="mono">{fmt(asNumber(stats?.median), 3, " dB")}</td>
                          <td className="mono">{fmt(asNumber(stats?.std), 3)}</td>
                          <td className="mono">{fmt(asNumber(stats?.power), 3)}</td>
                          <td className="mono">{fmt(asNumber(stats?.peak_to_peak), 3)}</td>
                          <td className="mono">{fmt(asNumber(stats?.crest_factor), 3)}</td>
                          <td className="mono">{echoes.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Panel>

              <Panel title="Frequency Response">
                <div className="status-chip-row">
                  <button
                    type="button"
                    className={lineVisibility.estimated ? "analysis-chip interactive active" : "analysis-chip interactive"}
                    onClick={() => setChannelLineVisibility((current) => ({
                      ...current,
                      [channelId]: {
                        estimated: !lineVisibility.estimated,
                        preEq: lineVisibility.preEq,
                      },
                    }))}
                  >
                    Estimated
                  </button>
                  <button
                    type="button"
                    className={lineVisibility.preEq ? "analysis-chip interactive active" : "analysis-chip interactive"}
                    onClick={() => setChannelLineVisibility((current) => ({
                      ...current,
                      [channelId]: {
                        estimated: lineVisibility.estimated,
                        preEq: !lineVisibility.preEq,
                      },
                    }))}
                  >
                    Pre-EQ
                  </button>
                </div>
                {combinedChannelSeries.length ? (
                  <div className="status-chip-row">
                    {combinedChannelSeries.map((series) => {
                      const visible = seriesVisibility[series.label] !== false;
                      return (
                        <button
                          key={`${channelId}-${series.label}`}
                          type="button"
                          className={visible ? "analysis-chip interactive active" : "analysis-chip interactive"}
                          onClick={() => setChannelSeriesVisibility((current) => ({
                            ...current,
                            [channelId]: {
                              ...(current[channelId] ?? {}),
                              [series.label]: !visible,
                            },
                          }))}
                        >
                          <span className="analysis-swatch" style={{ backgroundColor: series.color }} />
                          {series.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <LineAnalysisChart
                  title="Estimated Frequency Response + Pre-EQ Magnitude Response"
                  subtitle={`Channel ${channelId}`}
                  yLabel="dB"
                  showLegend={false}
                  series={visibleChannelSeries}
                  xDomain={selectedFrequencyZoom ?? undefined}
                  enableRangeSelection
                  selection={selectedFrequencyRange}
                  onSelectionChange={(nextSelection) => setFrequencySelection((current) => ({
                    ...current,
                    [channelId]: nextSelection,
                  }))}
                  selectionActions={(
                    <SpectrumSelectionActions
                      selection={selectedFrequencyRange}
                      hasZoomDomain={selectedFrequencyZoom !== null}
                      showIntegratedPower={false}
                      onApplyZoom={(domain) => setFrequencyZoomDomain((current) => ({
                        ...current,
                        [channelId]: domain,
                      }))}
                      onResetZoom={() => setFrequencyZoomDomain((current) => ({
                        ...current,
                        [channelId]: null,
                      }))}
                    />
                  )}
                  exportBaseName={`single-us-ofdma-pre-eq-frequency-response-channel-${channelId}`}
                />
              </Panel>

              <Panel title="Group Delay">
                <SeriesVisibilityChips
                  series={groupDelaySeries}
                  visibility={groupDelaySeriesVisibility[channelId] ?? {}}
                  onToggle={(label) => setGroupDelaySeriesVisibility((current) => ({
                    ...current,
                    [channelId]: {
                      ...(current[channelId] ?? {}),
                      [label]: (current[channelId]?.[label] ?? true) === false,
                    },
                  }))}
                />
                <LineAnalysisChart
                  title="Group Delay"
                  subtitle={`Channel ${channelId} · current vs last update`}
                  yLabel="μs"
                  yPadding={0.05}
                  showLegend={false}
                  series={visibleGroupDelay}
                  xDomain={selectedGroupDelayZoom ?? undefined}
                  enableRangeSelection
                  selection={selectedGroupDelayRange}
                  onSelectionChange={(nextSelection) => setGroupDelaySelection((current) => ({
                    ...current,
                    [channelId]: nextSelection,
                  }))}
                  selectionActions={(
                    <SpectrumSelectionActions
                      selection={selectedGroupDelayRange}
                      hasZoomDomain={selectedGroupDelayZoom !== null}
                      showIntegratedPower={false}
                      onApplyZoom={(domain) => setGroupDelayZoomDomain((current) => ({
                        ...current,
                        [channelId]: domain,
                      }))}
                      onResetZoom={() => setGroupDelayZoomDomain((current) => ({
                        ...current,
                        [channelId]: null,
                      }))}
                    />
                  )}
                  exportBaseName={`single-us-ofdma-pre-eq-group-delay-channel-${channelId}`}
                />
              </Panel>

              <Panel title="Echo Analysis">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Series</th>
                        <th>Bin Index</th>
                        <th>Time (μs)</th>
                        <th>Amplitude</th>
                        <th>Distance (m)</th>
                        <th>Distance (ft)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.flatMap((entry, entryIndex) => {
                        const echoes = entry.echo?.report?.echoes ?? [];
                        const label = buildSeriesVersionLabel(entry.pnm_header?.file_type_version);
                        if (!echoes.length) {
                          return (
                            <tr key={`${channelId}-${entryIndex}-none`}>
                              <td>{label}</td>
                              <td colSpan={5} className="mono">No secondary echoes in report.</td>
                            </tr>
                          );
                        }
                        return echoes.map((echo, echoIndex) => (
                          <tr key={`${channelId}-${entryIndex}-${echoIndex}`}>
                            <td>{label}</td>
                            <td className="mono">{echo.bin_index ?? "n/a"}</td>
                            <td className="mono">{fmt(asNumber(echo.time_s) === null ? null : asNumber(echo.time_s)! * 1_000_000, 4)}</td>
                            <td className="mono">{fmt(asNumber(echo.amplitude), 6)}</td>
                            <td className="mono">{fmt(asNumber(echo.distance_m), 2)}</td>
                            <td className="mono">{fmt(asNumber(echo.distance_ft), 2)}</td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
