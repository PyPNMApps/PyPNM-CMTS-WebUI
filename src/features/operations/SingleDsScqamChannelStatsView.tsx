import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { DsScqamChannelEntry, DsScqamChannelStatsResponse } from "@/types/api";

interface ChannelViewModel {
  index: string;
  channelId: string;
  frequencyMhz: number;
  frequencyText: string;
  widthText: string;
  modulation: string;
  interleave: string;
  powerDbmv: number | null;
  powerText: string;
  rxmerDb: number | null;
  rxmerText: string;
  microreflections: string;
  unerroreds: string;
  correcteds: string;
  uncorrectables: string;
  extUnerroreds: string;
  extCorrecteds: string;
  extUncorrectables: string;
}

function asNumber(value: number | string | undefined): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function fmtCount(value: number | undefined): string {
  return typeof value === "number" ? Math.trunc(value).toLocaleString("en-US") : "n/a";
}

function fmtPower(value: number | null): string {
  return value === null ? "n/a" : `${value.toFixed(1)} dBmV`;
}

function fmtDb(value: number | null): string {
  return value === null ? "n/a" : `${value.toFixed(1)} dB`;
}

function fmtMhz(value: number | undefined): { num: number; text: string } {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { num: 0, text: "n/a" };
  }
  return { num: value / 1e6, text: `${(value / 1e6).toFixed(3)} MHz` };
}

function toChannel(entry: DsScqamChannelEntry): ChannelViewModel {
  const frequency = fmtMhz(entry.entry?.docsIfDownChannelFrequency);
  return {
    index: String(entry.index ?? "n/a"),
    channelId: String(entry.channel_id ?? entry.entry?.docsIfDownChannelId ?? "n/a"),
    frequencyMhz: frequency.num,
    frequencyText: frequency.text,
    widthText: fmtMhz(entry.entry?.docsIfDownChannelWidth).text,
    modulation: entry.entry?.docsIfDownChannelModulation ?? "n/a",
    interleave: entry.entry?.docsIfDownChannelInterleave ?? "n/a",
    powerDbmv: asNumber(entry.entry?.docsIfDownChannelPower),
    powerText: fmtPower(asNumber(entry.entry?.docsIfDownChannelPower)),
    rxmerDb: asNumber(entry.entry?.docsIf3SignalQualityExtRxMER),
    rxmerText: fmtDb(asNumber(entry.entry?.docsIf3SignalQualityExtRxMER)),
    microreflections: fmtCount(entry.entry?.docsIfSigQMicroreflections),
    unerroreds: fmtCount(entry.entry?.docsIfSigQUnerroreds),
    correcteds: fmtCount(entry.entry?.docsIfSigQCorrecteds),
    uncorrectables: fmtCount(entry.entry?.docsIfSigQUncorrectables),
    extUnerroreds: fmtCount(entry.entry?.docsIfSigQExtUnerroreds),
    extCorrecteds: fmtCount(entry.entry?.docsIfSigQExtCorrecteds),
    extUncorrectables: fmtCount(entry.entry?.docsIfSigQExtUncorrectables),
  };
}

function statusText(status: number | string | undefined): string {
  if (status === 0) return "Success";
  return status === undefined || status === null ? "n/a" : String(status);
}

export function SingleDsScqamChannelStatsView({ response }: { response: DsScqamChannelStatsResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const channels = (response.results ?? []).map(toChannel).sort((left, right) => left.frequencyMhz - right.frequencyMhz);
  const avgPower = channels.length
    ? channels.reduce((sum, channel) => sum + (channel.powerDbmv ?? 0), 0) / channels.filter((channel) => channel.powerDbmv !== null).length
    : null;
  const avgRxmer = channels.length
    ? channels.reduce((sum, channel) => sum + (channel.rxmerDb ?? 0), 0) / channels.filter((channel) => channel.rxmerDb !== null).length
    : null;

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>Channels</b> {channels.length}</span>
        <span className="analysis-chip"><b>Avg Power</b> {fmtPower(avgPower)}</span>
        <span className="analysis-chip"><b>Avg RxMER</b> {fmtDb(avgRxmer)}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <div className="grid two">
        <Panel title="Downstream Power">
          <LineAnalysisChart
            title="Downstream Power"
            subtitle="Per-channel power by center frequency"
            yLabel="dBmV"
            series={[
              {
                label: "Power",
                color: "#79a9ff",
                points: channels.filter((channel) => channel.powerDbmv !== null).map((channel) => ({ x: channel.frequencyMhz, y: channel.powerDbmv ?? 0 })),
              },
            ]}
            showLegend={false}
          />
        </Panel>
        <Panel title="RxMER">
          <LineAnalysisChart
            title="RxMER"
            subtitle="Per-channel downstream RxMER by center frequency"
            yLabel="dB"
            series={[
              {
                label: "RxMER",
                color: "#58d0a7",
                points: channels.filter((channel) => channel.rxmerDb !== null).map((channel) => ({ x: channel.frequencyMhz, y: channel.rxmerDb ?? 0 })),
              },
            ]}
            showLegend={false}
          />
        </Panel>
      </div>

      <div className="grid two">
        {channels.map((channel) => (
          <Panel key={`ds-scqam-${channel.channelId}`} title={`DS Channel ${channel.channelId}`}>
            <div className="status-chip-row">
              <span className="analysis-chip"><b>Index</b> {channel.index}</span>
              <span className="analysis-chip"><b>Freq</b> {channel.frequencyText}</span>
              <span className="analysis-chip"><b>Power</b> {channel.powerText}</span>
              <span className="analysis-chip"><b>RxMER</b> {channel.rxmerText}</span>
            </div>
            <div className="settings-definition-list">
              <div className="settings-definition-row"><div className="settings-definition-key">Width</div><div className="mono">{channel.widthText}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Modulation</div><div className="mono">{channel.modulation}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Interleave</div><div className="mono">{channel.interleave}</div></div>
              <div className="settings-definition-row"><div className="settings-definition-key">Microreflections</div><div className="mono">{channel.microreflections}</div></div>
            </div>
            <div className="scqam-codeword-grid-two">
              <div className="scqam-codeword-card"><div className="scqam-codeword-label">Unerroreds</div><div className="scqam-codeword-value mono">{channel.unerroreds}</div></div>
              <div className="scqam-codeword-card"><div className="scqam-codeword-label">Correcteds</div><div className="scqam-codeword-value mono">{channel.correcteds}</div></div>
              <div className="scqam-codeword-card"><div className="scqam-codeword-label">Uncorrectables</div><div className="scqam-codeword-value mono">{channel.uncorrectables}</div></div>
              <div className="scqam-codeword-card"><div className="scqam-codeword-label">Ext Unerroreds</div><div className="scqam-codeword-value mono">{channel.extUnerroreds}</div></div>
              <div className="scqam-codeword-card"><div className="scqam-codeword-label">Ext Correcteds</div><div className="scqam-codeword-value mono">{channel.extCorrecteds}</div></div>
              <div className="scqam-codeword-card"><div className="scqam-codeword-label">Ext Uncorrectables</div><div className="scqam-codeword-value mono">{channel.extUncorrectables}</div></div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
