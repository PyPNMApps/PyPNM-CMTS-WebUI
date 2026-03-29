import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { ScqamCodewordErrorRateChart } from "@/pw/features/operations/ScqamCodewordErrorRateChart";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { DsScqamCodewordErrorRateEntry, DsScqamCodewordErrorRateResponse } from "@/types/api";

interface CodewordRateViewModel {
  index: string;
  channelId: string;
  totalCodewords: number;
  totalErrors: number;
  timeElapsed: number;
  errorRate: number;
  codewordsPerSecond: number;
  errorsPerSecond: number;
}

function asNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function fmtCount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function fmtRate(value: number): string {
  return Number.isFinite(value) ? value.toExponential(3) : "n/a";
}

function fmtPerSecond(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)}/s` : "n/a";
}

function fmtSeconds(value: number): string {
  return Number.isFinite(value) && value > 0 ? `${value.toFixed(0)} s` : "n/a";
}

function statusText(status: number | string | undefined): string {
  if (status === 0) return "Success";
  return status === undefined || status === null ? "n/a" : String(status);
}

function toEntry(entry: DsScqamCodewordErrorRateEntry): CodewordRateViewModel {
  return {
    index: String(entry.index ?? "n/a"),
    channelId: String(entry.channel_id ?? "n/a"),
    totalCodewords: asNumber(entry.codeword_totals?.total_codewords),
    totalErrors: asNumber(entry.codeword_totals?.total_errors),
    timeElapsed: asNumber(entry.codeword_totals?.time_elapsed),
    errorRate: asNumber(entry.codeword_totals?.error_rate),
    codewordsPerSecond: asNumber(entry.codeword_totals?.codewords_per_second),
    errorsPerSecond: asNumber(entry.codeword_totals?.errors_per_second),
  };
}

export function SingleDsScqamCodewordErrorRateView({ response }: { response: DsScqamCodewordErrorRateResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const entries = (response.results ?? []).map(toEntry).sort((left, right) => Number(left.channelId) - Number(right.channelId));
  const totalCodewords = entries.reduce((sum, entry) => sum + entry.totalCodewords, 0);
  const totalErrors = entries.reduce((sum, entry) => sum + entry.totalErrors, 0);
  const aggregateErrorRate = totalCodewords > 0 ? totalErrors / totalCodewords : 0;
  const sampleTimeElapsed = entries[0]?.timeElapsed ?? 0;

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>Channels</b> {entries.length}</span>
        <span className="analysis-chip"><b>Sample Time</b> {fmtSeconds(sampleTimeElapsed)}</span>
        <span className="analysis-chip"><b>Aggregate Error Rate</b> {fmtRate(aggregateErrorRate)}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <div className="status-chip-row">
        <span className="analysis-chip"><b>Total Codewords</b> {fmtCount(totalCodewords)}</span>
        <span className="analysis-chip"><b>Total Errors</b> {fmtCount(totalErrors)}</span>
      </div>

      <Panel title="Codeword Error Rate by Channel">
        <ScqamCodewordErrorRateChart
          title="SCQAM Codeword Error Rate"
          values={entries.map((entry) => ({
            channelId: entry.channelId,
            totalCodewords: entry.totalCodewords,
            totalErrors: entry.totalErrors,
          }))}
          exportBaseName="single-ds-scqam-codeword-error-rate"
        />
      </Panel>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Index</th>
              <th>Channel ID</th>
              <th>Total Codewords</th>
              <th>Total Errors</th>
              <th>Error Rate</th>
              <th>Codewords/s</th>
              <th>Errors/s</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={`scqam-cw-rate-${entry.channelId}`}>
                <td className="mono">{entry.index}</td>
                <td className="mono">{entry.channelId}</td>
                <td className="mono">{fmtCount(entry.totalCodewords)}</td>
                <td className="mono">{fmtCount(entry.totalErrors)}</td>
                <td className="mono">{fmtRate(entry.errorRate)}</td>
                <td className="mono">{fmtPerSecond(entry.codewordsPerSecond)}</td>
                <td className="mono">{fmtPerSecond(entry.errorsPerSecond)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
