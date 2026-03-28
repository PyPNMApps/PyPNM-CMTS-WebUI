import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { InterfaceStatsBridgeEntry, InterfaceStatsGroupEntry, InterfaceStatsResponse } from "@/types/api";

interface InterfaceRow {
  ifIndex: number;
  ifName: string;
  ifDescr: string;
  ifType: string;
  admin: string;
  oper: string;
  speed: string;
  inOctets: string;
  outOctets: string;
  operClass: string;
}

interface InterfaceGroupViewModel {
  key: string;
  title: string;
  rows: InterfaceRow[];
  upCount: number;
  downCount: number;
}

const TYPE_LABELS: Record<number, string> = {
  6: "Ethernet",
  127: "MAC",
  128: "SCQAM DS",
  129: "SCQAM US",
  277: "OFDM DS",
  278: "OFDMA US",
};

const GROUP_LABELS: Record<string, string> = {
  ethernetCsmacd: "Ethernet",
  docsCableMaclayer: "DOCSIS MAC Layer",
  docsCableDownstream: "SCQAM Downstream",
  docsOfdmDownstream: "OFDM Downstream",
  docsCableUpstream: "SCQAM Upstream",
  docsOfdmaUpstream: "OFDMA Upstream",
};

function asNumber(value: number | string | undefined): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatCount(value: number | string | undefined): string {
  const numeric = asNumber(value);
  return numeric === null ? "n/a" : Math.trunc(numeric).toLocaleString("en-US");
}

function formatSpeedBps(value: number | string | undefined): string {
  const numeric = asNumber(value);
  if (numeric === null || numeric <= 0) {
    return "n/a";
  }
  if (numeric >= 1e9) {
    return `${(numeric / 1e9).toFixed(2)} Gbps`;
  }
  if (numeric >= 1e6) {
    return `${(numeric / 1e6).toFixed(2)} Mbps`;
  }
  if (numeric >= 1e3) {
    return `${(numeric / 1e3).toFixed(2)} Kbps`;
  }
  return `${Math.round(numeric)} bps`;
}

function adminOper(value: number | string | undefined): string {
  const numeric = asNumber(value);
  if (numeric === 1) return "up";
  if (numeric === 2) return "down";
  if (numeric === 3) return "testing";
  return "unknown";
}

function interfaceType(value: number | string | undefined): string {
  const numeric = asNumber(value);
  if (numeric === null) {
    return "n/a";
  }
  return TYPE_LABELS[numeric] ? `${TYPE_LABELS[numeric]} (${numeric})` : String(numeric);
}

function bridgeName(bridge: InterfaceStatsBridgeEntry | undefined, ifIndex: number): { ifName: string | null; ifDescr: string | null } {
  const entry = bridge?.ifIndexes?.[String(ifIndex)];
  return {
    ifName: typeof entry?.ifName === "string" ? entry.ifName : null,
    ifDescr: typeof entry?.ifDescription === "string" ? entry.ifDescription : null,
  };
}

function toRow(entry: InterfaceStatsGroupEntry, bridge: InterfaceStatsBridgeEntry | undefined): InterfaceRow | null {
  const ifIndex = asNumber(entry.ifEntry?.ifIndex);
  if (ifIndex === null) {
    return null;
  }
  const bridgeEntry = bridgeName(bridge, ifIndex);
  const inOctets = entry.ifXEntry?.ifHCInOctets ?? entry.ifEntry?.ifInOctets;
  const outOctets = entry.ifXEntry?.ifHCOutOctets ?? entry.ifEntry?.ifOutOctets;
  const oper = adminOper(entry.ifEntry?.ifOperStatus);

  return {
    ifIndex,
    ifName: bridgeEntry.ifName ?? entry.ifXEntry?.ifName ?? "n/a",
    ifDescr: entry.ifEntry?.ifDescr ?? bridgeEntry.ifDescr ?? "n/a",
    ifType: interfaceType(entry.ifEntry?.ifType),
    admin: adminOper(entry.ifEntry?.ifAdminStatus),
    oper,
    speed: entry.ifXEntry?.ifHighSpeed ? `${formatCount(entry.ifXEntry.ifHighSpeed)} Mbps` : formatSpeedBps(entry.ifEntry?.ifSpeed),
    inOctets: formatCount(inOctets),
    outOctets: formatCount(outOctets),
    operClass: oper === "up" ? "ok" : oper === "down" ? "down" : "unknown",
  };
}

function toGroups(response: InterfaceStatsResponse): InterfaceGroupViewModel[] {
  const results = response.results;
  if (!results) {
    return [];
  }
  const bridge = results.bridge;
  const groups: InterfaceGroupViewModel[] = [];

  for (const [key, rawValue] of Object.entries(results)) {
    if (key === "bridge" || !Array.isArray(rawValue) || rawValue.length === 0) {
      continue;
    }

    const value = rawValue as InterfaceStatsGroupEntry[];
    const rows = value
      .map((entry: InterfaceStatsGroupEntry) => toRow(entry, bridge))
      .filter((entry: InterfaceRow | null): entry is InterfaceRow => entry !== null)
      .sort((left: InterfaceRow, right: InterfaceRow) => left.ifIndex - right.ifIndex);

    groups.push({
      key,
      title: GROUP_LABELS[key] ?? key,
      rows,
      upCount: rows.filter((row: InterfaceRow) => row.oper === "up").length,
      downCount: rows.filter((row: InterfaceRow) => row.oper === "down").length,
    });
  }

  return groups.sort((left, right) => left.title.localeCompare(right.title));
}

function statusText(status: number | string | undefined): string {
  if (status === 0) {
    return "Success";
  }
  if (status === undefined || status === null) {
    return "n/a";
  }
  return String(status);
}

export function SingleInterfaceStatsView({ response }: { response: InterfaceStatsResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const groups = toGroups(response);
  const totalInterfaces = groups.reduce((sum, group) => sum + group.rows.length, 0);
  const totalUp = groups.reduce((sum, group) => sum + group.upCount, 0);
  const totalDown = groups.reduce((sum, group) => sum + group.downCount, 0);

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>Groups</b> {groups.length}</span>
        <span className="analysis-chip"><b>Interfaces</b> {totalInterfaces}</span>
        <span className="analysis-chip"><b>Up</b> {totalUp}</span>
        <span className="analysis-chip"><b>Down</b> {totalDown}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      {groups.map((group) => (
        <Panel key={group.key} title={group.title}>
          <div className="status-chip-row interface-stats-summary-row">
            <span className="analysis-chip"><b>Interfaces</b> {group.rows.length}</span>
            <span className="analysis-chip"><b>Up</b> {group.upCount}</span>
            <span className="analysis-chip"><b>Down</b> {group.downCount}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>IfIndex</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Admin</th>
                  <th>Oper</th>
                  <th>Speed</th>
                  <th>In Octets</th>
                  <th>Out Octets</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={`${group.key}-${row.ifIndex}`}>
                    <td className="mono">{row.ifIndex}</td>
                    <td className="mono">{row.ifName}</td>
                    <td>{row.ifDescr}</td>
                    <td>{row.ifType}</td>
                    <td>{row.admin}</td>
                    <td>
                      <span className={`interface-oper-pill ${row.operClass}`}>{row.oper}</span>
                    </td>
                    <td>{row.speed}</td>
                    <td className="mono">{row.inOctets}</td>
                    <td className="mono">{row.outOctets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
    </div>
  );
}
