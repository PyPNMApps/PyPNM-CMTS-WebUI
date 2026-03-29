import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { SingleConstellationDisplayCaptureResponse } from "@/types/api";

import { ConstellationGridChart } from "./ConstellationGridChart";

export function SingleConstellationDisplayCaptureView({ response }: { response: SingleConstellationDisplayCaptureResponse }) {
  const channels = response.data?.analysis ?? [];

  if (!channels.length) {
    return <p className="panel-copy">No constellation display channels found.</p>;
  }

  const firstChannel = channels[0];
  const deviceInfo = toDeviceInfo(
    firstChannel?.device_details?.system_description ?? response.system_description,
    firstChannel?.mac_address ?? response.mac_address,
  );
  const captureTime = formatEpochSecondsUtc(firstChannel?.pnm_header?.capture_time);

  return (
    <div className="operations-visual-stack">
      <div className="status-chip-row">
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Capture Time</b> {captureTime}</span>
      </div>

      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>QAM</th>
              <th>Sample Symbols</th>
              <th>Soft Points</th>
              <th>Hard Points</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel, index) => {
              const soft = Array.isArray(channel.soft) ? channel.soft.length : Array.isArray(channel.soft?.complex) ? channel.soft.complex.length : 0;
              const hard = Array.isArray(channel.hard) ? channel.hard.length : Array.isArray(channel.hard?.complex) ? channel.hard.complex.length : 0;
              return (
                <tr key={channel.channel_id ?? index}>
                  <td>{channel.channel_id ?? "n/a"}</td>
                  <td>{channel.modulation_order ?? "n/a"}</td>
                  <td>{channel.num_sample_symbols ?? "n/a"}</td>
                  <td>{soft}</td>
                  <td>{hard}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConstellationGridChart channels={channels} exportBaseName="single-constellation-display" />
    </div>
  );
}
