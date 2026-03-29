import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { AtdmaChannelStatsResponse, AtdmaDwrWindowCheck, AtdmaUpstreamChannelEntry } from "@/types/api";

interface ChannelViewModel {
  index: string;
  channelId: string;
  upstreamId: string;
  frequencyMhz: string;
  widthMhz: string;
  txPower: number | null;
  txPowerText: string;
  preEqEnabled: boolean;
  muted: boolean;
  status: string;
  modulationType: string;
  slotSize: string;
  timingOffset: string;
  rangingStatus: string;
  channelType: string;
  t3Timeouts: string;
  t4Timeouts: string;
  t3Exceededs: string;
  rangingAborteds: string;
}

function asNumber(value: number | string | undefined): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function text(value: number | string | boolean | undefined | null, fallback = "n/a"): string {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

function formatMhz(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${(value / 1e6).toFixed(3)} MHz` : "n/a";
}

function formatDbmv(value: number | null): string {
  return value === null ? "n/a" : `${value.toFixed(1)} dBmV`;
}

function boolLabel(value: boolean): string {
  return value ? "true" : "false";
}

function dwrState(dwr: AtdmaDwrWindowCheck | null | undefined): "ok" | "warning" | "violation" {
  if (dwr?.is_violation) return "violation";
  if (dwr?.is_warning) return "warning";
  return "ok";
}

function toChannels(entries: AtdmaUpstreamChannelEntry[] | undefined): ChannelViewModel[] {
  return (entries ?? [])
    .map((entry) => ({
      index: text(entry.index, "—"),
      channelId: text(entry.channel_id, "—"),
      upstreamId: text(entry.entry?.docsIfUpChannelId, "—"),
      frequencyMhz: formatMhz(entry.entry?.docsIfUpChannelFrequency),
      widthMhz: formatMhz(entry.entry?.docsIfUpChannelWidth),
      txPower: asNumber(entry.entry?.docsIf3CmStatusUsTxPower),
      txPowerText: formatDbmv(asNumber(entry.entry?.docsIf3CmStatusUsTxPower)),
      preEqEnabled: Boolean(entry.entry?.docsIfUpChannelPreEqEnable),
      muted: Boolean(entry.entry?.docsIf3CmStatusUsIsMuted),
      status: text(entry.entry?.docsIfUpChannelStatus, "—"),
      modulationType: text(entry.entry?.docsIf3CmStatusUsModulationType, "—"),
      slotSize: text(entry.entry?.docsIfUpChannelSlotSize, "—"),
      timingOffset: text(entry.entry?.docsIfUpChannelTxTimingOffset, "—"),
      rangingStatus: text(entry.entry?.docsIf3CmStatusUsRangingStatus, "—"),
      channelType: text(entry.entry?.docsIfUpChannelType, "—"),
      t3Timeouts: text(entry.entry?.docsIf3CmStatusUsT3Timeouts, "—"),
      t4Timeouts: text(entry.entry?.docsIf3CmStatusUsT4Timeouts, "—"),
      t3Exceededs: text(entry.entry?.docsIf3CmStatusUsT3Exceededs, "—"),
      rangingAborteds: text(entry.entry?.docsIf3CmStatusUsRangingAborteds, "—"),
    }))
    .sort((left, right) => {
      const leftFreq = Number(left.frequencyMhz.split(" ")[0]);
      const rightFreq = Number(right.frequencyMhz.split(" ")[0]);
      if (Number.isFinite(leftFreq) && Number.isFinite(rightFreq) && leftFreq !== rightFreq) {
        return leftFreq - rightFreq;
      }
      return Number(left.channelId) - Number(right.channelId);
    });
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

function txPowerHeight(value: number | null, min: number, span: number): string {
  if (value === null) {
    return "6%";
  }
  const pct = ((value - min) / span) * 100;
  return `${Math.max(6, Math.min(100, pct)).toFixed(2)}%`;
}

function stateLabel(state: "ok" | "warning" | "violation"): string {
  if (state === "violation") return "VIOLATION";
  if (state === "warning") return "WARNING";
  return "OK";
}

function BoolPill({ value }: { value: boolean }) {
  return <span className={value ? "event-level-pill lvl6" : "event-level-pill lvlX"}>{boolLabel(value)}</span>;
}

export function SingleAtdmaChannelStatsView({ response }: { response: AtdmaChannelStatsResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const channels = toChannels(response.results?.entries);
  const dwr = response.results?.dwr_window_check;
  const state = dwrState(dwr);
  const powers = channels.map((channel) => channel.txPower).filter((value): value is number => value !== null);
  const minPower = powers.length ? Math.min(...powers) - 1 : 0;
  const maxPower = powers.length ? Math.max(...powers) + 1 : 1;
  const span = Math.max(1, maxPower - minPower);

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className={`analysis-chip ${state === "ok" ? "ok" : ""}`}><b>DWR</b> {stateLabel(state)}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Warn/Viol</b> {(dwr?.dwr_warning_db ?? 0).toFixed(2)}/{(dwr?.dwr_violation_db ?? 0).toFixed(2)} dB</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <Panel title="DWR Window Check">
        <div className="analysis-summary-grid">
          <div className="analysis-metric-card"><div className="analysis-metric-label">Spread</div><div className="analysis-metric-value">{dwr?.spread_db?.toFixed(2) ?? "n/a"} dB</div></div>
          <div className="analysis-metric-card"><div className="analysis-metric-label">Min Power</div><div className="analysis-metric-value">{dwr?.min_power_dbmv?.toFixed(1) ?? "n/a"} dBmV</div></div>
          <div className="analysis-metric-card"><div className="analysis-metric-label">Max Power</div><div className="analysis-metric-value">{dwr?.max_power_dbmv?.toFixed(1) ?? "n/a"} dBmV</div></div>
          <div className="analysis-metric-card"><div className="analysis-metric-label">Extreme Channel IDs</div><div className="analysis-metric-value mono">{dwr?.extreme_channel_ids?.join(", ") ?? "n/a"}</div></div>
        </div>
      </Panel>

      <Panel title="Tx Power">
        <div className="atdma-bar-plot">
          {channels.map((channel) => (
            <div key={`power-${channel.channelId}`} className="atdma-bar-column">
              <div className="atdma-bar-slot">
                <div className={`atdma-bar ${state}`} style={{ height: txPowerHeight(channel.txPower, minPower, span) }} />
              </div>
              <div className="mono atdma-bar-label">Ch {channel.channelId}</div>
              <div className="mono atdma-bar-subtitle">{channel.frequencyMhz}</div>
            </div>
          ))}
        </div>
        <div className="atdma-bar-axis mono">
          <span>{minPower.toFixed(1)} dBmV</span>
          <span>{((minPower + maxPower) / 2).toFixed(1)} dBmV</span>
          <span>{maxPower.toFixed(1)} dBmV</span>
        </div>
      </Panel>

      <div className="grid two">
        {channels.map((channel) => (
          <Panel key={`channel-${channel.channelId}`} title={`US Channel ${channel.channelId}`}>
            <div className="status-chip-row">
              <span className="analysis-chip"><b>Index</b> {channel.index}</span>
              <span className="analysis-chip"><b>UpId</b> {channel.upstreamId}</span>
              <span className="analysis-chip"><b>Tx Power</b> {channel.txPowerText}</span>
              <span className="analysis-chip"><b>Freq</b> {channel.frequencyMhz}</span>
              <span className="analysis-chip"><b>Type</b> {channel.channelType}</span>
            </div>
            <div className="settings-definition-list">
              <div className="settings-definition-row"><div className="settings-definition-key">Width</div><div className="mono">{channel.widthMhz}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Status</div><div className="mono">{channel.status}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Pre-EQ Enable</div><div><BoolPill value={channel.preEqEnabled} /></div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Muted</div><div><BoolPill value={channel.muted} /></div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Mod Type</div><div className="mono">{channel.modulationType}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Slot Size</div><div className="mono">{channel.slotSize}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Tx Timing Offset</div><div className="mono">{channel.timingOffset}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Ranging Status</div><div className="mono">{channel.rangingStatus}</div></div>
            </div>
            <div className="analysis-summary-grid atdma-counter-grid">
              <div className="analysis-metric-card"><div className="analysis-metric-label">T3 Timeouts</div><div className="analysis-metric-value mono">{channel.t3Timeouts}</div></div>
              <div className="analysis-metric-card"><div className="analysis-metric-label">T4 Timeouts</div><div className="analysis-metric-value mono">{channel.t4Timeouts}</div></div>
              <div className="analysis-metric-card"><div className="analysis-metric-label">T3 Exceededs</div><div className="analysis-metric-value mono">{channel.t3Exceededs}</div></div>
              <div className="analysis-metric-card"><div className="analysis-metric-label">Ranging Aborteds</div><div className="analysis-metric-value mono">{channel.rangingAborteds}</div></div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
