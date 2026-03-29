import { ExportActions } from "@/components/common/ExportActions";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { downloadCsv } from "@/lib/export/csv";
import { buildExportBaseName } from "@/lib/export/naming";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { AdvancedMultiRxMerAnalysisResponse, AdvancedMultiRxMerHeatMapChannel } from "@/types/api";

function epochToUtcLabel(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return new Date(value * 1000).toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function colorForValue(value: number, min: number, max: number): string {
  const range = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / range));
  const hue = 120 * ratio;
  const light = 16 + ratio * 44;
  return `hsl(${hue} 88% ${light.toFixed(1)}%)`;
}

function findValueRange(rows: number[][]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const row of rows) {
    for (const value of row) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        continue;
      }
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }

  return { min, max: min === max ? max + 1 : max };
}

function buildFrequencyTicks(frequency: number[]): Array<{ key: string; label: string }> {
  if (!frequency.length) {
    return [];
  }

  const tickIndexes = Array.from(new Set([
    0,
    Math.floor((frequency.length - 1) * 0.25),
    Math.floor((frequency.length - 1) * 0.5),
    Math.floor((frequency.length - 1) * 0.75),
    frequency.length - 1,
  ]));

  return tickIndexes.map((index) => ({
    key: `${index}-${frequency[index]}`,
    label: `${(frequency[index] / 1_000_000).toFixed(1)} MHz`,
  }));
}

function HeatMapGrid({ channel }: { channel: AdvancedMultiRxMerHeatMapChannel }) {
  const frequency = Array.isArray(channel.frequency) ? channel.frequency : [];
  const rows = Array.isArray(channel.values) ? channel.values.filter(Array.isArray) : [];
  const renderedColumns = frequency.length;
  const { min, max } = findValueRange(rows);
  const mid = min + (max - min) / 2;
  const frequencyTicks = buildFrequencyTicks(frequency);

  return (
    <div className="advanced-heatmap-shell">
      <div className="advanced-heatmap-frame">
        <div className="advanced-heatmap-scale" data-testid="advanced-rxmer-heatmap-scale">
          <div className="advanced-heatmap-scale-title">MER</div>
          <div className="advanced-heatmap-scale-bar" />
          <div className="advanced-heatmap-scale-label advanced-heatmap-scale-label-top">{max.toFixed(1)} dB</div>
          <div className="advanced-heatmap-scale-label advanced-heatmap-scale-label-middle">{mid.toFixed(1)}</div>
          <div className="advanced-heatmap-scale-label advanced-heatmap-scale-label-bottom">{min.toFixed(1)} dB</div>
        </div>
        <div
          className="advanced-heatmap-grid"
          data-testid="advanced-rxmer-heatmap-grid"
          style={{ gridTemplateColumns: `repeat(${Math.max(renderedColumns, 1)}, 1px)` }}
        >
          {rows.flatMap((row, rowIndex) =>
            row.slice(0, renderedColumns).map((value, columnIndex) => (
              <span
                key={`${rowIndex}-${columnIndex}`}
                className="advanced-heatmap-cell"
                style={{ background: colorForValue(Number(value), min, max) }}
                title={`Capture ${rowIndex + 1} · Bin ${columnIndex + 1} · ${Number(value).toFixed(2)} dB`}
              />
            )),
          )}
        </div>
      </div>
      {frequencyTicks.length ? (
        <div className="advanced-heatmap-axis-row">
          <div className="advanced-heatmap-axis-spacer" />
          <div className="advanced-heatmap-axis" data-testid="advanced-rxmer-heatmap-axis">
            {frequencyTicks.map((tick) => (
              <span key={tick.key} className="advanced-heatmap-axis-label">{tick.label}</span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="status-chip-row">
        <span className="analysis-chip"><b>Captures</b> {rows.length}</span>
        <span className="analysis-chip"><b>Subcarriers</b> {frequency.length}</span>
        <span className="analysis-chip"><b>Range</b> {min.toFixed(2)} to {max.toFixed(2)} dB</span>
      </div>
    </div>
  );
}

export function AdvancedRxMerHeatMapView({ response }: { response: AdvancedMultiRxMerAnalysisResponse }) {
  const channels = Object.entries(response.data ?? {}) as Array<[string, AdvancedMultiRxMerHeatMapChannel]>;
  const macAddress = response.device?.mac_address ?? response.mac_address;
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />
      {channels.map(([channelId, channel]) => (
        <Panel key={channelId} title={`Channel ${channelId} · RxMER Heat Map`}>
          <div className="status-chip-row">
            <span className="analysis-chip"><b>Start</b> {epochToUtcLabel(Array.isArray(channel.timestamps) ? channel.timestamps[0] : undefined)}</span>
            <span className="analysis-chip"><b>End</b> {epochToUtcLabel(Array.isArray(channel.timestamps) && channel.timestamps.length ? channel.timestamps[channel.timestamps.length - 1] : undefined)}</span>
          </div>
          <div className="operations-visual-actions">
            <ExportActions
              onCsv={() => downloadCsv(
                buildExportBaseName(
                  macAddress,
                  Array.isArray(channel.timestamps) ? channel.timestamps[0] : undefined,
                  `advanced-rxmer-heat-map-channel-${channelId}`,
                ),
                (channel.values ?? []).flatMap((row, captureIndex) =>
                  row.map((value, binIndex) => ({
                    capture_index: captureIndex + 1,
                    bin_index: binIndex + 1,
                    frequency_hz: channel.frequency?.[binIndex] ?? "n/a",
                    value_db: value,
                  })),
                ),
              )}
            />
          </div>
          <HeatMapGrid channel={channel} />
        </Panel>
      ))}
    </div>
  );
}
