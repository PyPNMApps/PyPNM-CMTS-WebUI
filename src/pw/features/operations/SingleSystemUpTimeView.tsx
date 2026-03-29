import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { SystemUpTimeResponse } from "@/types/api";

function statusText(status: number | string | undefined): string {
  if (status === 0) {
    return "Success";
  }

  if (status === undefined || status === null) {
    return "n/a";
  }

  return String(status);
}

export function SingleSystemUpTimeView({ response }: { response: SystemUpTimeResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const uptime = response.results?.uptime ?? "n/a";

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <Panel title="System UpTime">
        <div className="analysis-summary-grid">
          <div className="analysis-metric-card">
            <div className="analysis-metric-label">Uptime</div>
            <div className="analysis-metric-value system-uptime-value">{uptime}</div>
            <div className="analysis-metric-help">Human-readable SNMP system uptime</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
