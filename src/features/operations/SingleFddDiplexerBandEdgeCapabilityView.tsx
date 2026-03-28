import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { FddDiplexerBandEdgeCapabilityEntry, FddDiplexerBandEdgeCapabilityResponse } from "@/types/api";

interface CapabilityRow {
  index: string;
  usUpperBandEdgeMhz: number | null;
  dsLowerBandEdgeMhz: number | null;
  dsUpperBandEdgeMhz: number | null;
  supportedCount: number;
}

function asNumber(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fmtMhz(value: number | null): string {
  if (value === null) {
    return "n/a";
  }
  return value === 0 ? "unsupported" : `${value} MHz`;
}

function statusText(status: number | string | undefined): string {
  if (status === 0) {
    return "Success";
  }
  return status === undefined || status === null ? "n/a" : String(status);
}

function toRow(entry: FddDiplexerBandEdgeCapabilityEntry): CapabilityRow {
  const usUpperBandEdgeMhz = asNumber(entry.entry?.docsFddDiplexerUsUpperBandEdgeCapability);
  const dsLowerBandEdgeMhz = asNumber(entry.entry?.docsFddDiplexerDsLowerBandEdgeCapability);
  const dsUpperBandEdgeMhz = asNumber(entry.entry?.docsFddDiplexerDsUpperBandEdgeCapability);
  const supportedCount = [usUpperBandEdgeMhz, dsLowerBandEdgeMhz, dsUpperBandEdgeMhz].filter((value) => value !== null && value > 0).length;

  return {
    index: String(entry.index ?? "n/a"),
    usUpperBandEdgeMhz,
    dsLowerBandEdgeMhz,
    dsUpperBandEdgeMhz,
    supportedCount,
  };
}

export function SingleFddDiplexerBandEdgeCapabilityView({ response }: { response: FddDiplexerBandEdgeCapabilityResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const rows = (response.results ?? []).map(toRow).sort((left, right) => Number(left.index) - Number(right.index));
  const supportedEntries = rows.filter((row) => row.supportedCount > 0).length;
  const unsupportedEdges = rows.reduce((sum, row) => sum + (3 - row.supportedCount), 0);

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>Entries</b> {rows.length}</span>
        <span className="analysis-chip"><b>Supported Entries</b> {supportedEntries}</span>
        <span className="analysis-chip"><b>Unsupported Edges</b> {unsupportedEdges}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <Panel title="Diplexer Band Edge Capabilities">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Index</th>
                <th>US Upper Band Edge</th>
                <th>DS Lower Band Edge</th>
                <th>DS Upper Band Edge</th>
                <th>Supported Edges</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`fdd-diplexer-cap-${row.index}`}>
                  <td className="mono">{row.index}</td>
                  <td className="mono">{fmtMhz(row.usUpperBandEdgeMhz)}</td>
                  <td className="mono">{fmtMhz(row.dsLowerBandEdgeMhz)}</td>
                  <td className="mono">{fmtMhz(row.dsUpperBandEdgeMhz)}</td>
                  <td className="mono">{row.supportedCount}/3</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
