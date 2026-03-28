import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { If31DocsisBaseCapabilityResponse } from "@/types/api";

function statusText(status: number | string | undefined): string {
  if (status === 0) return "Success";
  return status === undefined || status === null ? "n/a" : String(status);
}

function docsisLabel(value: string | undefined): string {
  if (!value) return "n/a";
  return value.replaceAll("_", " ");
}

export function SingleIf31DocsisBaseCapabilityView({
  response,
}: {
  response: If31DocsisBaseCapabilityResponse;
}) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const capability = response.results;

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>DOCSIS Version</b> {docsisLabel(capability?.docsis_version)}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <Panel title="DOCSIS 3.1 Base Capability">
        <div className="analysis-summary-grid">
          <div className="analysis-metric-card">
            <div className="analysis-metric-label">DOCSIS Version</div>
            <div className="analysis-metric-value mono">{docsisLabel(capability?.docsis_version)}</div>
          </div>
          <div className="analysis-metric-card">
            <div className="analysis-metric-label">CLABS DOCSIS Version</div>
            <div className="analysis-metric-value mono">{capability?.clabs_docsis_version ?? "n/a"}</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
