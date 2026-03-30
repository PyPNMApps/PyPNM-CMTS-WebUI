import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FecChannelChart } from "@/pw/features/operations/FecChannelChart";
import {
  normalizeServingGroupFecSummaryResultsPayload,
  type ServingGroupFecSummaryGroupVisual,
} from "@/pcw/features/serving-group/lib/fecSummaryResults";
import { buildExportBaseName } from "@/lib/export/naming";
import { readSelectedModemIpByMac, saveSelectedModemContext } from "@/pw/features/single-capture/lib/selectedModemContext";
import { buildLinePreviewPath, computeLinePreviewBounds } from "@/lib/charts/linePreview";

interface ServingGroupFecSummaryResultsViewProps {
  payload: unknown;
}

function formatCmCountLabel(count: number): string {
  return count === 1 ? "1 CM" : `${count} CMs`;
}

function buildFecPreviewPoints(modem: ServingGroupFecSummaryGroupVisual["channels"][number]["modems"][number]) {
  const firstProfile = modem.profiles[0];
  if (!firstProfile) {
    return [];
  }
  const timestamps = firstProfile.codewords.timestamps ?? [];
  const totalCodewords = firstProfile.codewords.total_codewords ?? [];
  const length = Math.min(timestamps.length, totalCodewords.length);
  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < length; index += 1) {
    points.push({ x: timestamps[index], y: totalCodewords[index] });
  }
  return points;
}

function FecPreview({
  modem,
  width,
  height,
}: {
  modem: ServingGroupFecSummaryGroupVisual["channels"][number]["modems"][number];
  width: number;
  height: number;
}) {
  const points = useMemo(() => buildFecPreviewPoints(modem), [modem]);
  const bounds = useMemo(
    () => computeLinePreviewBounds(points),
    [points],
  );
  const pad = 8;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  const hasPoints = points.length > 0 && bounds !== null;
  const linePath = hasPoints ? buildLinePreviewPath(points, bounds, width, height, pad) : "";

  return (
    <svg
      className="constellation-preview-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="FEC preview"
    >
      <rect x={pad} y={pad} width={innerWidth} height={innerHeight} fill="rgba(255,255,255,0.04)" stroke="rgba(121,169,255,0.55)" />
      {hasPoints ? (
        <path d={linePath} fill="none" stroke="#79a9ff" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      ) : (
        <text x="50%" y="52%" textAnchor="middle" className="constellation-preview-empty-label">No Data</text>
      )}
    </svg>
  );
}

function ChannelSection({
  groupId,
  channel,
}: {
  groupId: string;
  channel: ServingGroupFecSummaryGroupVisual["channels"][number];
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const numericChannelId = Number.parseInt(channel.channelId, 10);
  const numericGroupId = Number.parseInt(groupId, 10);

  return (
    <article className="analysis-channel-card">
      <div className="analysis-channel-top">
        <h3 className="analysis-channel-title">Channel {channel.channelId}</h3>
        <div className="analysis-channel-meta-line">
          <span>{formatCmCountLabel(channel.modems.length)}</span>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>MAC Address</th>
              <th>Vendor</th>
              <th>Model</th>
              <th>Version</th>
              <th>Capture Time (UTC)</th>
              <th>Profiles</th>
              <th>Samples</th>
              <th className="constellation-preview-column">Preview</th>
            </tr>
          </thead>
          <tbody>
            {channel.modems.map((modem) => {
              const isExpanded = expandedKey === modem.key;
              const sampleCount = modem.profiles.reduce((sum, profile) => (
                sum + (profile.codewords.timestamps?.length ?? 0)
              ), 0);

              return (
                <Fragment key={modem.key}>
                  <tr>
                    <td className="mono">
                      <Link
                        to="/single-capture/fec-summary"
                        onClick={() => {
                          const resolvedIpAddress = modem.ipAddress !== "n/a"
                            ? modem.ipAddress
                            : (readSelectedModemIpByMac(modem.macAddress) ?? "n/a");
                          saveSelectedModemContext({
                            sgId: Number.isFinite(numericGroupId) ? numericGroupId : -1,
                            macAddress: modem.macAddress,
                            ipAddress: resolvedIpAddress,
                            snmpCommunity: "private",
                            channelIds: Number.isFinite(numericChannelId) ? [numericChannelId] : [],
                            selectedAtEpochMs: Date.now(),
                          });
                        }}
                      >
                        {modem.macAddress}
                      </Link>
                    </td>
                    <td>{modem.vendor}</td>
                    <td>{modem.model}</td>
                    <td>{modem.softwareVersion}</td>
                    <td>{modem.captureTimeLabel}</td>
                    <td>{modem.profiles.length}</td>
                    <td>{sampleCount}</td>
                    <td className="constellation-preview-column">
                      <button
                        type="button"
                        className="constellation-preview-button"
                        onClick={() => setExpandedKey((current) => (current === modem.key ? null : modem.key))}
                        aria-expanded={isExpanded}
                        aria-label={`Toggle FEC details for ${modem.macAddress}`}
                      >
                        <span className="constellation-preview-thumb">
                          <FecPreview modem={modem} width={110} height={68} />
                          <span className="constellation-preview-hover">
                            <FecPreview modem={modem} width={300} height={200} />
                          </span>
                        </span>
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="constellation-expanded-row">
                      <td colSpan={8}>
                        <div className="constellation-expanded-panel">
                          <FecChannelChart
                            title={`FEC Summary (MAC ${modem.macAddress})`}
                            profiles={modem.profiles}
                            exportBaseName={buildExportBaseName(
                              modem.macAddress,
                              modem.captureTimeEpoch,
                              `sg-fec-summary-sg-${groupId}-channel-${channel.channelId}`,
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
    </article>
  );
}

export function ServingGroupFecSummaryResultsView({ payload }: ServingGroupFecSummaryResultsViewProps) {
  const normalized = normalizeServingGroupFecSummaryResultsPayload(payload);

  if (!normalized.serviceGroups.length && normalized.missingModems.length === 0) {
    return <p className="panel-copy">No SG FEC Summary results available yet.</p>;
  }

  return (
    <div className="operations-visual-stack">
      {normalized.serviceGroups.map((group) => (
        <details key={group.key} className="chart-frame capture-request-dropdown">
          <summary className="capture-request-dropdown-summary">
            <span>Service Group {group.serviceGroupId}</span>
          </summary>
          <div className="analysis-channels-grid analysis-channels-grid-single">
            {group.channels.map((channel) => (
              <details key={channel.key} className="analysis-channel-card capture-request-dropdown">
                <summary className="capture-request-dropdown-summary">
                  <span>Channel {channel.channelId} · {formatCmCountLabel(channel.modems.length)}</span>
                </summary>
                <ChannelSection groupId={group.serviceGroupId} channel={channel} />
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
