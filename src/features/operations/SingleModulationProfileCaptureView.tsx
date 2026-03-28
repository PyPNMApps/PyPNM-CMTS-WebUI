import { useEffect, useMemo, useState } from "react";

import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { SeriesVisibilityChips } from "@/components/common/SeriesVisibilityChips";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import type { ChartSeries } from "@/features/analysis/types";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { SingleModulationProfileCaptureResponse } from "@/types/api";

const profileColors = ["#ff6c37", "#4caf50", "#2196f3", "#ffa500", "#9c27b0", "#f44336", "#00bcd4", "#8bc34a"] as const;

function profileLabel(profileId: number, modulation: string[] | undefined): string {
  const modulationLabel = modulation?.[0] ? String(modulation[0]).replace("qam_", "QAM-") : "Unknown";
  return `Profile ${profileId} (${modulationLabel})`;
}

function toSeries(
  profileId: number,
  modulation: string[] | undefined,
  frequency: number[],
  values: number[],
  color: string,
  channelId?: number,
): ChartSeries {
  return {
    label: channelId === undefined ? profileLabel(profileId, modulation) : `Ch ${channelId} · ${profileLabel(profileId, modulation)}`,
    color,
    points: values.map((value, index) => ({
      x: (frequency[index] ?? 0) / 1_000_000,
      y: value,
    })),
  };
}

export function SingleModulationProfileCaptureView({ response }: { response: SingleModulationProfileCaptureResponse }) {
  const channels = useMemo(() => response.data?.analysis ?? [], [response.data?.analysis]);
  const channelKeys = useMemo(() => channels.map((channel) => String(channel.channel_id ?? "n/a")), [channels]);
  const profileKeys = useMemo(
    () => [...new Set(channels.flatMap((channel) => (channel.profiles ?? []).map((profile) => String(profile.profile_id))))],
    [channels],
  );
  const [visibleChannelKeys, setVisibleChannelKeys] = useState<string[]>(channelKeys);
  const [visibleProfileKeys, setVisibleProfileKeys] = useState<string[]>(profileKeys.includes("0") ? ["0"] : profileKeys.slice(0, 1));
  const [combinedSeriesVisibility, setCombinedSeriesVisibility] = useState<Record<string, boolean>>({});
  const [channelSeriesVisibility, setChannelSeriesVisibility] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    setVisibleChannelKeys(channelKeys);
  }, [channelKeys]);

  useEffect(() => {
    setVisibleProfileKeys(profileKeys.includes("0") ? ["0"] : profileKeys.slice(0, 1));
  }, [profileKeys]);

  if (!channels.length) {
    return <p className="panel-copy">No modulation profile channels found.</p>;
  }

  const firstChannel = channels[0];
  const deviceInfo = toDeviceInfo(
    firstChannel?.device_details?.system_description ?? response.system_description,
    firstChannel?.mac_address ?? response.mac_address,
  );
  const captureTime = formatEpochSecondsUtc(firstChannel?.pnm_header?.capture_time);
  const combinedSeries = channels
    .filter((channel) => visibleChannelKeys.includes(String(channel.channel_id ?? "n/a")))
    .flatMap((channel) =>
      (channel.profiles ?? [])
        .filter((profile) => visibleProfileKeys.includes(String(profile.profile_id)))
        .map((profile, index) =>
          toSeries(
            profile.profile_id,
            profile.carrier_values.modulation,
            profile.carrier_values.frequency,
            profile.carrier_values.shannon_min_mer,
            profileColors[(profile.profile_id ?? index) % profileColors.length],
            channel.channel_id,
          ),
        ),
    );
  const visibleCombinedSeries = combinedSeries.filter((series) => combinedSeriesVisibility[series.label] !== false);
  const combinedPoints = combinedSeries.flatMap((series) => series.points);
  const combinedXDomain = combinedPoints.length
    ? [Math.min(...combinedPoints.map((point) => point.x)), Math.max(...combinedPoints.map((point) => point.x))] as [number, number]
    : undefined;
  const combinedYDomain = combinedPoints.length
    ? [Math.min(...combinedPoints.map((point) => point.y)) - 0.35, Math.max(...combinedPoints.map((point) => point.y)) + 0.35] as [number, number]
    : undefined;

  return (
    <div className="operations-visual-stack">
      <div className="status-chip-row">
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Profile Metric</b> Shannon Min MER</span>
        <span className="analysis-chip"><b>Capture Time</b> {captureTime}</span>
      </div>

      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="chart-frame">
        <div className="chart-header">
          <div className="chart-title">{`All Channels (${channels.length}) - Modulation Profiles by Frequency`}</div>
        </div>
        <div className="mod-profile-controls">
          <div className="mod-profile-control-group">
            <div className="mod-profile-control-label">Channels</div>
            <div className="status-chip-row">
              {channels.map((channel) => {
                const key = String(channel.channel_id ?? "n/a");
                const active = visibleChannelKeys.includes(key);
                return (
                  <button
                    key={`channel-${key}`}
                    type="button"
                    className={active ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
                    onClick={() => {
                      setVisibleChannelKeys((current) => {
                        if (current.includes(key)) {
                          return current.length === 1 ? current : current.filter((entry) => entry !== key);
                        }
                        return [...current, key];
                      });
                    }}
                  >
                    Channel {key}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mod-profile-control-group">
            <div className="mod-profile-control-label">Profiles</div>
            <div className="status-chip-row">
              {profileKeys.map((profileKey) => {
                const active = visibleProfileKeys.includes(profileKey);
                return (
                  <button
                    key={`profile-${profileKey}`}
                    type="button"
                    className={active ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
                    onClick={() => {
                      setVisibleProfileKeys((current) => {
                        if (current.includes(profileKey)) {
                          return current.length === 1 ? current : current.filter((entry) => entry !== profileKey);
                        }
                        return [...current, profileKey];
                      });
                    }}
                  >
                    Profile {profileKey}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <SeriesVisibilityChips
          series={combinedSeries}
          visibility={combinedSeriesVisibility}
          onToggle={(label) => setCombinedSeriesVisibility((current) => ({ ...current, [label]: current[label] === false }))}
        />
        <LineAnalysisChart
          title=""
          subtitle=""
          yLabel="Shannon Min MER (dB)"
          series={visibleCombinedSeries}
          showLegend={false}
          xDomain={combinedXDomain}
          yDomain={combinedYDomain}
          exportBaseName="single-modulation-profile-all-channels"
        />
      </div>

      <div className="analysis-channels-grid">
        {channels.map((channel, channelIndex) => {
          const channelKey = String(channel.channel_id ?? "n/a");
          const perChannelSeries = (channel.profiles ?? []).map((profile, index) =>
            toSeries(
              profile.profile_id,
              profile.carrier_values.modulation,
              profile.carrier_values.frequency,
              profile.carrier_values.shannon_min_mer,
              profileColors[(profile.profile_id ?? index) % profileColors.length],
            ),
          );
          const visiblePerChannelSeries = perChannelSeries.filter(
            (series) => (channelSeriesVisibility[channelKey] ?? {})[series.label] !== false,
          );

          return (
            <article key={channel.channel_id ?? channelIndex} className="analysis-channel-card">
              <div className="analysis-channel-top">
                <div className="analysis-channel-meta-line analysis-channel-meta-line-header">
                  <h3 className="analysis-channel-title">Channel {channel.channel_id ?? "n/a"}</h3>
                </div>
              </div>
              <div className="analysis-channel-body">
                <SeriesVisibilityChips
                  series={perChannelSeries}
                  visibility={channelSeriesVisibility[channelKey] ?? {}}
                  onToggle={(label) =>
                    setChannelSeriesVisibility((current) => ({
                      ...current,
                      [channelKey]: {
                        ...(current[channelKey] ?? {}),
                        [label]: (current[channelKey]?.[label] ?? true) === false,
                      },
                    }))
                  }
                />
                <LineAnalysisChart
                  title=""
                  subtitle=""
                  yLabel="Shannon Min MER (dB)"
                  series={visiblePerChannelSeries}
                  exportBaseName={`single-modulation-profile-channel-${channel.channel_id ?? "n/a"}`}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
