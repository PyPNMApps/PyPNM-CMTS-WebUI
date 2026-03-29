import { ExportActions } from "@/components/common/ExportActions";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { downloadCsv } from "@/lib/export/csv";
import { buildExportBaseName } from "@/lib/export/naming";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { AdvancedMultiChanEstAnalysisResponse, AdvancedMultiChanEstEchoDetectionResult } from "@/types/api";

export function AdvancedChannelEstEchoDetectionView({ response }: { response: AdvancedMultiChanEstAnalysisResponse }) {
  const results = (response.data?.results ?? []) as AdvancedMultiChanEstEchoDetectionResult[];
  const macAddress = response.device?.mac_address ?? response.mac_address;
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />
      <div className="if31-ds-ofdm-channel-grid">
        {results.map((channel) => (
          <Panel key={channel.channel_id} title={`Channel ${channel.channel_id} · Echo Detection IFFT`}>
            <div className="status-chip-row">
              <span className="analysis-chip"><b>Subcarriers</b> {channel.dataset_info?.subcarriers ?? 0}</span>
              <span className="analysis-chip"><b>Snapshots</b> {channel.dataset_info?.snapshots ?? 0}</span>
              <span className="analysis-chip"><b>Sample Rate</b> {typeof channel.sample_rate_hz === "number" ? `${(channel.sample_rate_hz / 1_000_000).toFixed(0)} MHz` : "n/a"}</span>
              <span className="analysis-chip"><b>VF</b> {typeof channel.velocity_factor === "number" ? channel.velocity_factor.toFixed(2) : "n/a"}</span>
            </div>
            <div className="operations-visual-actions">
              <ExportActions
                onCsv={() => downloadCsv(
                  buildExportBaseName(macAddress, undefined, `advanced-channel-estimation-echo-detection-channel-${channel.channel_id}`),
                  [
                    {
                      type: "Direct",
                      rank: 0,
                      delay_us: typeof channel.direct_path?.time_s === "number" ? (channel.direct_path.time_s * 1_000_000).toFixed(3) : "n/a",
                      distance_m: typeof channel.direct_path?.distance_m === "number" ? channel.direct_path.distance_m.toFixed(2) : "n/a",
                      distance_ft: typeof channel.direct_path?.distance_ft === "number" ? channel.direct_path.distance_ft.toFixed(2) : "n/a",
                      amplitude: typeof channel.direct_path?.amplitude === "number" ? channel.direct_path.amplitude.toFixed(3) : "n/a",
                    },
                    ...(channel.echoes ?? []).map((echo, index) => ({
                      type: "Echo",
                      rank: index + 1,
                      delay_us: typeof echo.time_s === "number" ? (echo.time_s * 1_000_000).toFixed(3) : "n/a",
                      distance_m: typeof echo.distance_m === "number" ? echo.distance_m.toFixed(2) : "n/a",
                      distance_ft: typeof echo.distance_ft === "number" ? echo.distance_ft.toFixed(2) : "n/a",
                      amplitude: typeof echo.amplitude === "number" ? echo.amplitude.toFixed(3) : "n/a",
                    })),
                  ],
                )}
              />
            </div>
            <div className="table-scroll">
              <table className="channel-metrics-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Rank</th>
                    <th>Delay (us)</th>
                    <th>Distance (m)</th>
                    <th>Distance (ft)</th>
                    <th>Amplitude</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Direct</td>
                    <td className="mono">0</td>
                    <td className="mono">{typeof channel.direct_path?.time_s === "number" ? (channel.direct_path.time_s * 1_000_000).toFixed(3) : "n/a"}</td>
                    <td className="mono">{typeof channel.direct_path?.distance_m === "number" ? channel.direct_path.distance_m.toFixed(2) : "n/a"}</td>
                    <td className="mono">{typeof channel.direct_path?.distance_ft === "number" ? channel.direct_path.distance_ft.toFixed(2) : "n/a"}</td>
                    <td className="mono">{typeof channel.direct_path?.amplitude === "number" ? channel.direct_path.amplitude.toFixed(3) : "n/a"}</td>
                  </tr>
                  {(channel.echoes ?? []).length ? (channel.echoes ?? []).map((echo, index) => (
                    <tr key={`${channel.channel_id}-${index}`}>
                      <td>Echo</td>
                      <td className="mono">{index + 1}</td>
                      <td className="mono">{typeof echo.time_s === "number" ? (echo.time_s * 1_000_000).toFixed(3) : "n/a"}</td>
                      <td className="mono">{typeof echo.distance_m === "number" ? echo.distance_m.toFixed(2) : "n/a"}</td>
                      <td className="mono">{typeof echo.distance_ft === "number" ? echo.distance_ft.toFixed(2) : "n/a"}</td>
                      <td className="mono">{typeof echo.amplitude === "number" ? echo.amplitude.toFixed(3) : "n/a"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td>Echo</td>
                      <td className="mono">-</td>
                      <td className="mono" colSpan={4}>No secondary echoes in report</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
