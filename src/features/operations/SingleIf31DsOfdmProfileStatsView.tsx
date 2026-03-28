import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { If31DsOfdmProfileStatsChart } from "@/features/operations/If31DsOfdmProfileStatsChart";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type {
  If31DsOfdmProfileStat,
  If31DsOfdmProfileStatsChannel,
  If31DsOfdmProfileStatsResponse,
} from "@/types/api";

interface ProfileSeriesViewModel {
  label: string;
  total: number;
  corrected: number;
  uncorrectable: number;
  inOctets: number;
  unicastOctets: number;
  multicastOctets: number;
}

interface ChannelViewModel {
  index: string;
  channelId: string;
  profiles: ProfileSeriesViewModel[];
  totalCodewords: number;
  totalCorrected: number;
  correctedRate: number;
  worstProfile: string;
}

function asNumber(value: number | string | undefined): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function statusText(status: number | string | undefined): string {
  if (status === 0) return "Success";
  return status === undefined || status === null ? "n/a" : String(status);
}

function fmtCount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function fmtPercent(value: number): string {
  return `${(value * 100).toFixed(4)}%`;
}

function isReservedProfileLabel(label: string): boolean {
  const normalized = String(label).trim().toUpperCase();
  return normalized === "255" || normalized === "NCP";
}

function toProfiles(profiles: Record<string, If31DsOfdmProfileStat> | undefined): ProfileSeriesViewModel[] {
  return Object.entries(profiles ?? {})
    .sort((left, right) => Number(left[0]) - Number(right[0]))
    .map(([profileId, stat]) => ({
      label: profileId,
      total: asNumber(stat.docsIf31CmDsOfdmProfileStatsTotalCodewords),
      corrected: asNumber(stat.docsIf31CmDsOfdmProfileStatsCorrectedCodewords),
      uncorrectable: asNumber(stat.docsIf31CmDsOfdmProfileStatsUncorrectableCodewords),
      inOctets: asNumber(stat.docsIf31CmDsOfdmProfileStatsInOctets),
      unicastOctets: asNumber(stat.docsIf31CmDsOfdmProfileStatsInUnicastOctets),
      multicastOctets: asNumber(stat.docsIf31CmDsOfdmProfileStatsInMulticastOctets),
    }));
}

function toChannel(channel: If31DsOfdmProfileStatsChannel): ChannelViewModel {
  const profiles = toProfiles(channel.profiles);
  const totalCodewords = profiles.reduce((sum, profile) => sum + profile.total, 0);
  const totalCorrected = profiles.reduce((sum, profile) => sum + profile.corrected, 0);
  const correctedRate = totalCodewords > 0 ? totalCorrected / totalCodewords : 0;
  const worst = profiles.reduce<{ rate: number; label: string } | null>((current, profile) => {
    if (profile.total <= 0) return current;
    const rate = profile.corrected / profile.total;
    if (!current || rate > current.rate) {
      return { rate, label: profile.label };
    }
    return current;
  }, null);

  return {
    index: String(channel.index ?? "n/a"),
    channelId: String(channel.channel_id ?? "n/a"),
    profiles,
    totalCodewords,
    totalCorrected,
    correctedRate,
    worstProfile: worst?.label ?? "n/a",
  };
}

export function SingleIf31DsOfdmProfileStatsView({
  response,
}: {
  response: If31DsOfdmProfileStatsResponse;
}) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const channels = (response.results ?? []).map(toChannel).sort((left, right) => Number(left.channelId) - Number(right.channelId));
  const totalCorrectedAll = channels.reduce((sum, channel) => sum + channel.totalCorrected, 0);
  const dominantProfileMap = new Map<string, number>();
  let worst: { channelId: string; profile: string; rate: number } | null = null;

  for (const channel of channels) {
    for (const profile of channel.profiles) {
      if (!isReservedProfileLabel(profile.label)) {
        dominantProfileMap.set(profile.label, (dominantProfileMap.get(profile.label) ?? 0) + profile.total);
      }
      if (profile.total > 0) {
        const rate = profile.corrected / profile.total;
        if (!worst || rate > worst.rate) {
          worst = { channelId: channel.channelId, profile: profile.label, rate };
        }
      }
    }
  }

  const dominantProfile = [...dominantProfileMap.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "n/a";

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Dominant Profile</b> {dominantProfile}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <div className="analysis-summary-grid">
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Worst Corrected Rate</div>
          <div className="analysis-metric-value mono">{worst ? fmtPercent(worst.rate) : "n/a"}</div>
          <div className="chart-meta">{worst ? `Ch ${worst.channelId} · Profile ${worst.profile}` : "No active profiles"}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Total Corrected Codewords</div>
          <div className="analysis-metric-value mono">{fmtCount(totalCorrectedAll)}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Dominant Profile</div>
          <div className="analysis-metric-value mono">{dominantProfile}</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Index</th>
              <th>Channel ID</th>
              <th>Profiles</th>
              <th>Total Corrected</th>
              <th>Total Codewords</th>
              <th>Corrected Rate</th>
              <th>Worst Profile</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={`if31-ds-profile-summary-${channel.channelId}`}>
                <td className="mono">{channel.index}</td>
                <td className="mono">{channel.channelId}</td>
                <td className="mono">{channel.profiles.length}</td>
                <td className="mono">{fmtCount(channel.totalCorrected)}</td>
                <td className="mono">{fmtCount(channel.totalCodewords)}</td>
                <td className="mono">{fmtPercent(channel.correctedRate)}</td>
                <td className="mono">{channel.worstProfile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="profile-stats-channel-grid">
        {channels.map((channel) => (
          <Panel key={`if31-ds-profile-${channel.channelId}`} title={`OFDM Channel ${channel.channelId}`}>
            <If31DsOfdmProfileStatsChart
              title="Total / Corrected / Uncorrectable Codewords"
              subtitle="Per-profile codeword counters for this OFDM downstream channel"
              mode="codewords"
              values={channel.profiles}
              exportBaseName={`single-if31-ds-ofdm-profile-stats-codewords-channel-${channel.channelId}`}
            />
            <div className="profile-stats-stack">
              <If31DsOfdmProfileStatsChart
                title="In Octets by Profile"
                subtitle="Per-profile downstream octet totals"
                mode="octets"
                values={channel.profiles}
                exportBaseName={`single-if31-ds-ofdm-profile-stats-octets-channel-${channel.channelId}`}
              />
              <If31DsOfdmProfileStatsChart
                title="Unicast vs Multicast Octets"
                subtitle="Traffic split by profile"
                mode="traffic"
                values={channel.profiles}
                exportBaseName={`single-if31-ds-ofdm-profile-stats-traffic-channel-${channel.channelId}`}
              />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
