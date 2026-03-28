import { ExportActions } from "@/components/common/ExportActions";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { downloadCsv } from "@/lib/export/csv";
import { buildExportBaseName } from "@/lib/export/naming";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { AdvancedMultiChanEstAnalysisResponse, AdvancedMultiChanEstLteDetectionResult } from "@/types/api";

export function AdvancedChannelEstLteDetectionView({ response }: { response: AdvancedMultiChanEstAnalysisResponse }) {
  const results = (response.data?.results ?? []) as AdvancedMultiChanEstLteDetectionResult[];
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
          <Panel key={channel.channel_id} title={`Channel ${channel.channel_id} · LTE Detection Phase Slope`}>
            <div className="status-chip-row">
              <span className="analysis-chip"><b>Threshold</b> {channel.threshold?.toExponential?.(2) ?? "n/a"}</span>
              <span className="analysis-chip"><b>Anomalies</b> {channel.anomalies?.length ?? 0}</span>
            </div>
            <div className="operations-visual-actions">
              <ExportActions
                onCsv={() => downloadCsv(
                  buildExportBaseName(macAddress, undefined, `advanced-channel-estimation-lte-detection-channel-${channel.channel_id}`),
                  (channel.bin_widths ?? []).map((width, index) => ({
                    bin_width_hz: width,
                    anomaly_delta: channel.anomalies?.[index]?.toExponential?.(3) ?? "n/a",
                  })),
                )}
              />
            </div>
            <div className="table-scroll">
              <table className="channel-metrics-table">
                <thead>
                  <tr>
                    <th>Bin Width (Hz)</th>
                    <th>Anomaly Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {(channel.bin_widths ?? []).map((width, index) => (
                    <tr key={`${channel.channel_id}-${width}-${index}`}>
                      <td className="mono">{width.toLocaleString()}</td>
                      <td className="mono">{channel.anomalies?.[index]?.toExponential?.(3) ?? "n/a"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
