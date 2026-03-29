import { Fragment, useMemo, useState } from "react";
import { ConstellationGridChart } from "@/features/operations/ConstellationGridChart";
import {
  normalizeServingGroupConstellationDisplayResultsPayload,
  type ServingGroupConstellationDisplayGroupVisual,
} from "@/features/serving-group/lib/constellationDisplayResults";
import { buildExportBaseName } from "@/lib/export/naming";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";

interface ServingGroupConstellationDisplayResultsViewProps {
  payload: unknown;
}

type ConstellationPoint = [number, number];

function asPoints(values: unknown): ConstellationPoint[] {
  if (Array.isArray(values)) {
    return values
      .filter((point): point is [number, number] => Array.isArray(point) && point.length >= 2)
      .map((point) => [Number(point[0]), Number(point[1])] as [number, number])
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  }
  if (values && typeof values === "object") {
    const record = values as { complex?: unknown };
    if (Array.isArray(record.complex)) {
      return asPoints(record.complex);
    }
  }
  return [];
}

function buildBounds(soft: ConstellationPoint[], hard: ConstellationPoint[]) {
  const points = [...soft, ...hard];
  if (points.length === 0) {
    return null;
  }
  const xValues = points.map((point) => point[0]);
  const yValues = points.map((point) => point[1]);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const span = Math.max(maxX - minX || 1, maxY - minY || 1);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const half = span / 2 + span * 0.07;
  return {
    minX: centerX - half,
    maxX: centerX + half,
    minY: centerY - half,
    maxY: centerY + half,
  };
}

function ConstellationPreview({
  soft,
  hard,
  width,
  height,
}: {
  soft: ConstellationPoint[];
  hard: ConstellationPoint[];
  width: number;
  height: number;
}) {
  const bounds = useMemo(() => buildBounds(soft, hard), [soft, hard]);
  const pad = 10;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  const hasPoints = bounds !== null;

  return (
    <svg
      className="constellation-preview-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Constellation preview"
    >
      <rect x={pad} y={pad} width={innerWidth} height={innerHeight} fill="rgba(255,255,255,0.04)" stroke="rgba(121,169,255,0.55)" />
      <line x1={width / 2} y1={pad} x2={width / 2} y2={height - pad} stroke="rgba(255,255,255,0.24)" />
      <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="rgba(255,255,255,0.24)" />
      {bounds ? soft.map((point, index) => {
        const x = pad + ((point[0] - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * innerWidth;
        const y = pad + innerHeight - ((point[1] - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * innerHeight;
        return <circle key={`soft-${index}`} cx={x} cy={y} r="1.5" fill="rgba(47,98,255,0.9)" />;
      }) : null}
      {bounds ? hard.map((point, index) => {
        const x = pad + ((point[0] - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * innerWidth;
        const y = pad + innerHeight - ((point[1] - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * innerHeight;
        return <rect key={`hard-${index}`} x={x - 1.2} y={y - 1.2} width="2.4" height="2.4" fill="rgba(220,70,70,0.85)" />;
      }) : null}
      {!hasPoints ? (
        <text x="50%" y="52%" textAnchor="middle" className="constellation-preview-empty-label">No Points</text>
      ) : null}
    </svg>
  );
}

function ChannelModemTable({
  groupId,
  channel,
}: {
  groupId: string;
  channel: ServingGroupConstellationDisplayGroupVisual["channels"][number];
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>MAC Address</th>
            <th>Vendor</th>
            <th>Model</th>
            <th>Version</th>
            <th>QAM</th>
            <th>Sample Symbols</th>
            <th>Capture Time (UTC)</th>
            <th className="constellation-preview-column">Preview</th>
          </tr>
        </thead>
        <tbody>
          {channel.modems.map((modem) => {
            const isExpanded = expandedKey === modem.key;
            const soft = asPoints(modem.analysisEntry.soft);
            const hard = asPoints(modem.analysisEntry.hard);
            const captureTime = modem.analysisEntry.pnm_header?.capture_time;
            const captureTimeLabel = typeof captureTime === "number" ? formatEpochSecondsUtc(captureTime) : "n/a";
            return (
              <Fragment key={modem.key}>
                <tr>
                  <td className="mono">{modem.macAddress}</td>
                  <td>{modem.vendor}</td>
                  <td>{modem.model}</td>
                  <td>{modem.softwareVersion}</td>
                  <td>{modem.analysisEntry.modulation_order ?? "n/a"}</td>
                  <td>{modem.analysisEntry.num_sample_symbols ?? "n/a"}</td>
                  <td>{captureTimeLabel}</td>
                  <td className="constellation-preview-column">
                    <button
                      type="button"
                      className="constellation-preview-button"
                      onClick={() => setExpandedKey((current) => (current === modem.key ? null : modem.key))}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle constellation details for ${modem.macAddress}`}
                    >
                      <span className="constellation-preview-thumb">
                        <ConstellationPreview soft={soft} hard={hard} width={110} height={68} />
                        <span className="constellation-preview-hover">
                          <ConstellationPreview soft={soft} hard={hard} width={300} height={200} />
                        </span>
                      </span>
                    </button>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="constellation-expanded-row">
                    <td colSpan={8}>
                      <div className="constellation-expanded-panel">
                        <ConstellationGridChart
                          channels={[modem.analysisEntry]}
                          exportBaseName={buildExportBaseName(
                            modem.macAddress,
                            typeof captureTime === "number" ? captureTime : undefined,
                            `sg-constellation-display-sg-${groupId}-channel-${channel.channelId}`,
                          )}
                        />
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ServingGroupConstellationDisplayResultsView({ payload }: ServingGroupConstellationDisplayResultsViewProps) {
  const normalized = normalizeServingGroupConstellationDisplayResultsPayload(payload);

  if (!normalized.serviceGroups.length && normalized.missingModems.length === 0) {
    return <p className="panel-copy">No SG Constellation Display results available yet.</p>;
  }

  return (
    <div className="operations-visual-stack">
      {normalized.serviceGroups.map((group) => (
        <details key={group.key} className="chart-frame capture-request-dropdown">
          <summary className="capture-request-dropdown-summary">
            <span>Service Group {group.serviceGroupId}</span>
          </summary>
          <div className="operations-visual-stack">
            {group.channels.map((channel) => (
              <details key={channel.key} className="analysis-channel-card capture-request-dropdown">
                <summary className="capture-request-dropdown-summary">
                  <span>Channel {channel.channelId} · {channel.modems.length} modem(s)</span>
                </summary>
                <ChannelModemTable groupId={group.serviceGroupId} channel={channel} />
              </details>
            ))}
          </div>
        </details>
      ))}
      {normalized.missingModems.length > 0 ? (
        <article className="chart-frame">
          <div className="analysis-channel-top">
            <h3 className="analysis-channel-title">Excluded Cable Modems</h3>
            <div className="analysis-channel-meta-line">
              <span>MACs omitted from visuals due to missing or unusable data</span>
              <span>Total: {normalized.missingModems.length}</span>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Service Group</th>
                  <th>Channel</th>
                  <th>MAC Address</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {normalized.missingModems.map((entry) => (
                  <tr key={entry.key}>
                    <td>{entry.serviceGroupId}</td>
                    <td>{entry.channelId}</td>
                    <td className="mono">{entry.macAddress}</td>
                    <td>{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </div>
  );
}
