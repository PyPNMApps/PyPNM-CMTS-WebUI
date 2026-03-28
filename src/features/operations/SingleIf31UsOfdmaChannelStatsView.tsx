import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import { OFDMAActiveWindowChart } from "@/features/operations/OFDMAActiveWindowChart";
import { OFDMAEventBarChart } from "@/features/operations/OFDMAEventBarChart";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { If31UsOfdmaChannelEntry, If31UsOfdmaChannelStatsResponse } from "@/types/api";

interface ChannelViewModel {
  index: string;
  channelId: string;
  zeroMhz: number;
  startMhz: number;
  endMhz: number;
  centerMhz: number;
  bandwidthMhz: number;
  activeSubcarriers: number;
  txPowerDbmv: number;
  preEqEnabled: boolean;
  muted: boolean;
  rangingStatus: string;
  configChangeCount: number;
  cyclicPrefix: string;
  rollOffPeriod: string;
  symbolsPerFrame: string;
  t3: number;
  t4: number;
  abort: number;
  exceed: number;
}

function asNumber(value: number | string | undefined): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function statusText(status: number | string | undefined): string {
  if (status === 0) {
    return "Success";
  }
  return status === undefined || status === null ? "n/a" : String(status);
}

function formatBool(value: boolean): string {
  return value ? "true" : "false";
}

function fmtMhz(value: number): string {
  return `${value.toFixed(3)} MHz`;
}

function toChannel(entry: If31UsOfdmaChannelEntry): ChannelViewModel {
  const channelId = asNumber(entry.channel_id ?? entry.entry?.docsIf31CmUsOfdmaChanChannelId);
  const zeroHz = asNumber(entry.entry?.docsIf31CmUsOfdmaChanSubcarrierZeroFreq);
  const firstActive = asNumber(entry.entry?.docsIf31CmUsOfdmaChanFirstActiveSubcarrierNum);
  const lastActive = asNumber(entry.entry?.docsIf31CmUsOfdmaChanLastActiveSubcarrierNum);
  const spacingRaw = asNumber(entry.entry?.docsIf31CmUsOfdmaChanSubcarrierSpacing);
  const spacingHz = spacingRaw >= 1000 ? spacingRaw : spacingRaw * 1000;
  const startHz = zeroHz + firstActive * spacingHz;
  const endHz = zeroHz + lastActive * spacingHz;
  const bandwidthHz = lastActive >= firstActive ? (lastActive - firstActive + 1) * spacingHz : 0;

  return {
    index: String(entry.index ?? "n/a"),
    channelId: String(channelId || "n/a"),
    zeroMhz: zeroHz / 1e6,
    startMhz: startHz / 1e6,
    endMhz: endHz / 1e6,
    centerMhz: ((startHz / 1e6) + (endHz / 1e6)) / 2,
    bandwidthMhz: bandwidthHz / 1e6,
    activeSubcarriers: asNumber(entry.entry?.docsIf31CmUsOfdmaChanNumActiveSubcarriers),
    txPowerDbmv: asNumber(entry.entry?.docsIf31CmUsOfdmaChanTxPower),
    preEqEnabled: Boolean(entry.entry?.docsIf31CmUsOfdmaChanPreEqEnabled),
    muted: Boolean(entry.entry?.docsIf31CmStatusOfdmaUsIsMuted),
    rangingStatus: String(entry.entry?.docsIf31CmStatusOfdmaUsRangingStatus ?? "n/a"),
    configChangeCount: asNumber(entry.entry?.docsIf31CmUsOfdmaChanConfigChangeCt),
    cyclicPrefix: String(entry.entry?.docsIf31CmUsOfdmaChanCyclicPrefix ?? "n/a"),
    rollOffPeriod: String(entry.entry?.docsIf31CmUsOfdmaChanRollOffPeriod ?? "n/a"),
    symbolsPerFrame: String(entry.entry?.docsIf31CmUsOfdmaChanNumSymbolsPerFrame ?? "n/a"),
    t3: asNumber(entry.entry?.docsIf31CmStatusOfdmaUsT3Timeouts),
    t4: asNumber(entry.entry?.docsIf31CmStatusOfdmaUsT4Timeouts),
    abort: asNumber(entry.entry?.docsIf31CmStatusOfdmaUsRangingAborteds),
    exceed: asNumber(entry.entry?.docsIf31CmStatusOfdmaUsT3Exceededs),
  };
}

export function SingleIf31UsOfdmaChannelStatsView({ response }: { response: If31UsOfdmaChannelStatsResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const channels = (response.results ?? []).map(toChannel).sort((left, right) => Number(left.channelId) - Number(right.channelId));
  const totalActive = channels.reduce((sum, channel) => sum + channel.activeSubcarriers, 0);
  const anyMuted = channels.some((channel) => channel.muted);
  const worstT3Channel = channels.reduce((worst, channel) => (channel.t3 > worst.t3 ? channel : worst), channels[0] ?? null);
  const globalStart = channels.length ? Math.min(...channels.map((channel) => channel.startMhz)) : 0;
  const globalEnd = channels.length ? Math.max(...channels.map((channel) => channel.endMhz)) : 0;

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Total Active Subcarriers</b> {totalActive.toLocaleString("en-US")}</span>
        <span className="analysis-chip"><b>Any Muted</b> {formatBool(anyMuted)}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <div className="analysis-summary-grid">
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Global Active Spectrum Span</div>
          <div className="analysis-metric-value mono">{fmtMhz(globalEnd - globalStart)}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Active Range</div>
          <div className="analysis-metric-value mono">{`${globalStart.toFixed(3)} - ${globalEnd.toFixed(3)} MHz`}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Worst T3</div>
          <div className="analysis-metric-value mono">{worstT3Channel ? `${worstT3Channel.t3} (Ch ${worstT3Channel.channelId})` : "n/a"}</div>
        </div>
      </div>

      <Panel title="Active Spectrum Windows">
        <OFDMAActiveWindowChart
          title="Global Active Spectrum Windows"
          values={channels.map((channel) => ({
            label: `Ch ${channel.channelId}`,
            zeroMhz: channel.zeroMhz,
            startMhz: channel.startMhz,
            endMhz: channel.endMhz,
          }))}
          exportBaseName="single-if31-us-ofdma-active-spectrum-windows"
        />
      </Panel>

      <Panel title="Tx Power">
        <LineAnalysisChart
          title="Tx Power"
          subtitle="Per-channel upstream OFDMA transmit power by active-window center frequency"
          yLabel="dBmV"
          showLegend={false}
          series={[
            {
              label: "Tx Power",
              color: "#58d0a7",
              points: channels.map((channel) => ({ x: channel.centerMhz, y: channel.txPowerDbmv })),
            },
          ]}
          exportBaseName="single-if31-us-ofdma-tx-power"
        />
      </Panel>

      <div className="grid two">
        {channels.map((channel) => (
          <Panel key={`us-ofdma-${channel.channelId}`} title={`OFDMA Channel ${channel.channelId}`}>
            <div className="status-chip-row">
              <span className="analysis-chip"><b>Tx Power</b> {channel.txPowerDbmv.toFixed(1)} dBmV</span>
              <span className="analysis-chip"><b>Pre-EQ</b> {formatBool(channel.preEqEnabled)}</span>
              <span className="analysis-chip"><b>Muted</b> {formatBool(channel.muted)}</span>
              <span className="analysis-chip"><b>Ranging</b> {channel.rangingStatus}</span>
            </div>
            <div className="settings-definition-list">
              <div className="settings-definition-row"><div className="settings-definition-key">Zero Frequency</div><div className="mono">{fmtMhz(channel.zeroMhz)}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Active Start</div><div className="mono">{fmtMhz(channel.startMhz)}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Active End</div><div className="mono">{fmtMhz(channel.endMhz)}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Bandwidth</div><div className="mono">{fmtMhz(channel.bandwidthMhz)}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Active Subcarriers</div><div className="mono">{channel.activeSubcarriers.toLocaleString("en-US")}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Config Change Ct</div><div className="mono">{channel.configChangeCount}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Cyclic Prefix</div><div className="mono">{channel.cyclicPrefix}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Roll-Off Period</div><div className="mono">{channel.rollOffPeriod}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Symbols Per Frame</div><div className="mono">{channel.symbolsPerFrame}</div></div>
            </div>
            <OFDMAEventBarChart
              title="Timeout / Event Counters"
              t3={channel.t3}
              t4={channel.t4}
              abort={channel.abort}
              exceed={channel.exceed}
              exportBaseName={`single-if31-us-ofdma-event-counters-channel-${channel.channelId}`}
            />
          </Panel>
        ))}
      </div>
    </div>
  );
}
