import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { DsOfdmActiveWindowChart } from "@/features/operations/DsOfdmActiveWindowChart";
import { DsOfdmReliabilityChart } from "@/features/operations/DsOfdmReliabilityChart";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { If31DsOfdmChannelStatsEntry, If31DsOfdmChannelStatsResponse } from "@/types/api";

interface ChannelViewModel {
  index: string;
  channelId: string;
  indicator: string;
  zeroMhz: number;
  startMhz: number;
  endMhz: number;
  bandwidthMhz: number;
  plcMhz: number;
  activeSubcarriers: number;
  spacingKhz: number;
  cyclicPrefix: string;
  rollOffPeriod: string;
  pilots: number;
  interleaverDepth: number;
  plcTotalCw: number;
  plcUnreliableCw: number;
  ncpTotalFields: number;
  ncpCrcFailures: number;
}

function asNumber(value: number | string | undefined): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function statusText(status: number | string | undefined): string {
  if (status === 0) return "Success";
  return status === undefined || status === null ? "n/a" : String(status);
}

function fmtMhz(value: number): string {
  return `${value.toFixed(3)} MHz`;
}

function fmtCount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function isPrimaryIndicator(indicator: string): boolean {
  return indicator.toLowerCase() === "primary";
}

function isBackupPrimaryIndicator(indicator: string): boolean {
  return indicator.toLowerCase().includes("backupprimary");
}

function toChannel(entry: If31DsOfdmChannelStatsEntry): ChannelViewModel {
  const data = entry.entry ?? {};
  const zeroHz = asNumber(data.docsIf31CmDsOfdmChanSubcarrierZeroFreq);
  const firstActive = asNumber(data.docsIf31CmDsOfdmChanFirstActiveSubcarrierNum);
  const lastActive = asNumber(data.docsIf31CmDsOfdmChanLastActiveSubcarrierNum);
  const spacingHz = asNumber(data.docsIf31CmDsOfdmChanSubcarrierSpacing);
  const startHz = zeroHz + firstActive * spacingHz;
  const endHz = zeroHz + lastActive * spacingHz;
  const bandwidthHz = lastActive >= firstActive ? (lastActive - firstActive + 1) * spacingHz : 0;

  return {
    index: String(entry.index ?? "n/a"),
    channelId: String(entry.channel_id ?? data.docsIf31CmDsOfdmChanChannelId ?? "n/a"),
    indicator: String(data.docsIf31CmDsOfdmChanChanIndicator ?? "n/a"),
    zeroMhz: zeroHz / 1e6,
    startMhz: startHz / 1e6,
    endMhz: endHz / 1e6,
    bandwidthMhz: bandwidthHz / 1e6,
    plcMhz: asNumber(data.docsIf31CmDsOfdmChanPlcFreq) / 1e6,
    activeSubcarriers: asNumber(data.docsIf31CmDsOfdmChanNumActiveSubcarriers),
    spacingKhz: spacingHz / 1e3,
    cyclicPrefix: String(data.docsIf31CmDsOfdmChanCyclicPrefix ?? "n/a"),
    rollOffPeriod: String(data.docsIf31CmDsOfdmChanRollOffPeriod ?? "n/a"),
    pilots: asNumber(data.docsIf31CmDsOfdmChanNumPilots),
    interleaverDepth: asNumber(data.docsIf31CmDsOfdmChanTimeInterleaverDepth),
    plcTotalCw: asNumber(data.docsIf31CmDsOfdmChanPlcTotalCodewords),
    plcUnreliableCw: asNumber(data.docsIf31CmDsOfdmChanPlcUnreliableCodewords),
    ncpTotalFields: asNumber(data.docsIf31CmDsOfdmChanNcpTotalFields),
    ncpCrcFailures: asNumber(data.docsIf31CmDsOfdmChanNcpFieldCrcFailures),
  };
}

export function SingleIf31DsOfdmChannelStatsView({ response }: { response: If31DsOfdmChannelStatsResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const channels = (response.results ?? []).map(toChannel).sort((left, right) => Number(left.channelId) - Number(right.channelId));
  const totalActiveSubcarriers = channels.reduce((sum, channel) => sum + channel.activeSubcarriers, 0);
  const worstNcpCrc = channels.reduce((worst, channel) => (channel.ncpCrcFailures > worst.ncpCrcFailures ? channel : worst), channels[0] ?? null);
  const worstPlcUnreliable = channels.reduce((worst, channel) => (channel.plcUnreliableCw > worst.plcUnreliableCw ? channel : worst), channels[0] ?? null);
  const globalMin = channels.length ? Math.min(...channels.map((channel) => channel.startMhz)) : 0;
  const globalMax = channels.length ? Math.max(...channels.map((channel) => channel.endMhz)) : 0;

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Total Active Subcarriers</b> {fmtCount(totalActiveSubcarriers)}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <div className="analysis-summary-grid">
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Est. Occupied Bandwidth</div>
          <div className="analysis-metric-value mono">{channels[0] ? fmtMhz(channels[0].bandwidthMhz) : "n/a"}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Worst NCP CRC Failures</div>
          <div className="analysis-metric-value mono">{worstNcpCrc ? fmtCount(worstNcpCrc.ncpCrcFailures) : "n/a"}</div>
          <div className="chart-meta">{worstNcpCrc ? `Ch ${worstNcpCrc.channelId}` : ""}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Worst PLC Unreliable CW</div>
          <div className="analysis-metric-value mono">{worstPlcUnreliable ? fmtCount(worstPlcUnreliable.plcUnreliableCw) : "n/a"}</div>
          <div className="chart-meta">{worstPlcUnreliable ? `Ch ${worstPlcUnreliable.channelId}` : ""}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Global Active Spectrum Span</div>
          <div className="analysis-metric-value mono">{fmtMhz(globalMax - globalMin)}</div>
          <div className="chart-meta">{`${globalMin.toFixed(3)} - ${globalMax.toFixed(3)} MHz`}</div>
        </div>
      </div>

      <Panel title="Global Active Spectrum Windows">
        <DsOfdmActiveWindowChart
          title="Global Active Spectrum Windows"
          subtitle="Each row shows the active OFDM window with PLC marker"
          values={channels.map((channel) => ({
            label: `Ch ${channel.channelId}`,
            zeroMhz: channel.zeroMhz,
            startMhz: channel.startMhz,
            endMhz: channel.endMhz,
            plcMhz: channel.plcMhz,
            isPrimary: isPrimaryIndicator(channel.indicator),
            isBackupPrimary: isBackupPrimaryIndicator(channel.indicator),
          }))}
          exportBaseName="single-if31-ds-ofdm-active-spectrum-windows"
        />
      </Panel>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Indicator</th>
              <th>Zero Freq</th>
              <th>Active Start</th>
              <th>Active End</th>
              <th>PLC</th>
              <th>BW</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={`if31-ds-ofdm-quick-${channel.channelId}`}>
                <td className="mono">{channel.channelId}</td>
                <td>{channel.indicator}</td>
                <td className="mono">{fmtMhz(channel.zeroMhz)}</td>
                <td className="mono">{fmtMhz(channel.startMhz)}</td>
                <td className="mono">{fmtMhz(channel.endMhz)}</td>
                <td className="mono">{fmtMhz(channel.plcMhz)}</td>
                <td className="mono">{fmtMhz(channel.bandwidthMhz)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="if31-ds-ofdm-channel-grid">
        {channels.map((channel) => (
          <Panel key={`if31-ds-ofdm-chan-${channel.channelId}`} title={`OFDM Channel ${channel.channelId}`}>
            <DsOfdmReliabilityChart
              title="Reliability Counters"
              plcTotalCw={channel.plcTotalCw}
              plcUnreliableCw={channel.plcUnreliableCw}
              ncpTotalFields={channel.ncpTotalFields}
              ncpCrcFailures={channel.ncpCrcFailures}
              exportBaseName={`single-if31-ds-ofdm-reliability-channel-${channel.channelId}`}
            />
            <div className="table-wrap">
              <table className="channel-metrics-table">
                <tbody>
                  <tr>
                    <th>Subcarrier Spacing</th>
                    <td className="mono">{channel.spacingKhz.toFixed(0)} kHz</td>
                  </tr>
                  <tr>
                    <th>Num Active Subcarriers</th>
                    <td className="mono">{fmtCount(channel.activeSubcarriers)}</td>
                  </tr>
                  <tr>
                    <th>Cyclic Prefix</th>
                    <td className="mono">{channel.cyclicPrefix}</td>
                  </tr>
                  <tr>
                    <th>Roll-Off Period</th>
                    <td className="mono">{channel.rollOffPeriod}</td>
                  </tr>
                  <tr>
                    <th>Pilots</th>
                    <td className="mono">{fmtCount(channel.pilots)}</td>
                  </tr>
                  <tr>
                    <th>Time Interleaver Depth</th>
                    <td className="mono">{fmtCount(channel.interleaverDepth)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
