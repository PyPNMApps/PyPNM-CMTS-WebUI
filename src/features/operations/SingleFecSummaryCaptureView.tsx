import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { SingleFecSummaryCaptureResponse } from "@/types/api";

import { FecChannelChart } from "./FecChannelChart";

export function SingleFecSummaryCaptureView({ response }: { response: SingleFecSummaryCaptureResponse }) {
  const channels = response.data?.analysis ?? [];

  if (!channels.length) {
    return <p className="panel-copy">No FEC summary channels found.</p>;
  }

  const firstChannel = channels[0];
  const deviceInfo = toDeviceInfo(
    firstChannel?.device_details?.system_description ?? response.system_description,
    response.mac_address,
  );
  const profileCount = channels.reduce((sum, channel) => sum + (channel.profiles?.length ?? 0), 0);

  return (
    <div className="operations-visual-stack">
      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {response.mac_address ?? "n/a"}</span>
        <span className="analysis-chip"><b>Status</b> {response.status === 0 ? "OK" : String(response.status ?? "n/a")}</span>
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Profiles</b> {profileCount}</span>
      </div>

      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="analysis-channels-grid">
        {channels.map((channel) => (
          <article key={channel.channel_id ?? Math.random()} className="analysis-channel-card">
            <div className="analysis-channel-top">
              <div className="analysis-channel-meta-line analysis-channel-meta-line-header">
                <h3 className="analysis-channel-title">Channel {channel.channel_id ?? "n/a"}</h3>
                <span>Profiles: {channel.profiles?.length ?? 0}</span>
              </div>
            </div>
            <div className="analysis-channel-body">
              <FecChannelChart
                title={`Channel ${channel.channel_id ?? "n/a"} Codeword Analysis`}
                profiles={channel.profiles ?? []}
                exportBaseName={`single-fec-summary-channel-${channel.channel_id ?? "n/a"}`}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
