import { Fragment, useMemo, useState } from "react";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import type { ChartSeries } from "@/features/analysis/types";
import {
  normalizeServingGroupModulationProfileResultsPayload,
  type ServingGroupModulationProfileGroupVisual,
} from "@/features/serving-group/lib/modulationProfileResults";
import { buildExportBaseName } from "@/lib/export/naming";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";

interface ServingGroupModulationProfileResultsViewProps {
  payload: unknown;
}

function asPreviewSeries(series: ChartSeries[]) {
  if (series.length > 0) {
    return series;
  }
  return [];
}

function computeBounds(series: ChartSeries[]) {
  const points = series.flatMap((entry) => entry.points);
  if (points.length === 0) {
    return null;
  }
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  return {
    minX: Math.min(...xValues),
    maxX: Math.max(...xValues),
    minY: Math.min(...yValues),
    maxY: Math.max(...yValues),
  };
}

function LinePreview({
  series,
  width,
  height,
}: {
  series: ChartSeries[];
  width: number;
  height: number;
}) {
  const bounds = useMemo(() => computeBounds(series), [series]);
  const pad = 8;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;

  function toPath(entry: ChartSeries): string {
    if (!bounds) {
      return "";
    }
    return entry.points.map((point, index) => {
      const x = pad + ((point.x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * innerWidth;
      const y = pad + innerHeight - ((point.y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * innerHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");
  }

  return (
    <svg
      className="constellation-preview-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Modulation profile preview"
    >
      <rect x={pad} y={pad} width={innerWidth} height={innerHeight} fill="rgba(255,255,255,0.04)" stroke="rgba(121,169,255,0.55)" />
      {bounds ? series.map((entry) => (
        <path
          key={entry.label}
          d={toPath(entry)}
          fill="none"
          stroke={entry.color}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )) : (
        <text x="50%" y="54%" textAnchor="middle" className="constellation-preview-empty-label">No Data</text>
      )}
    </svg>
  );
}

function ChannelModemTable({
  groupId,
  channel,
}: {
  groupId: string;
  channel: ServingGroupModulationProfileGroupVisual["channels"][number];
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [selectionByKey, setSelectionByKey] = useState<Record<string, SpectrumSelectionRange | null>>({});
  const [zoomByKey, setZoomByKey] = useState<Record<string, [number, number] | null>>({});

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>MAC Address</th>
            <th>Vendor</th>
            <th>Model</th>
            <th>Version</th>
            <th>Profiles</th>
            <th>Capture Time (UTC)</th>
            <th className="constellation-preview-column">Preview</th>
          </tr>
        </thead>
        <tbody>
          {channel.modems.map((modem) => {
            const isExpanded = expandedKey === modem.key;
            const previewSeries = asPreviewSeries(modem.profileSeries);
            return (
              <Fragment key={modem.key}>
                <tr>
                  <td className="mono">{modem.macAddress}</td>
                  <td>{modem.vendor}</td>
                  <td>{modem.model}</td>
                  <td>{modem.softwareVersion}</td>
                  <td>{modem.profileSeries.length}</td>
                  <td>{modem.captureTimeLabel}</td>
                  <td className="constellation-preview-column">
                    <button
                      type="button"
                      className="constellation-preview-button"
                      onClick={() => setExpandedKey((current) => (current === modem.key ? null : modem.key))}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle modulation profile details for ${modem.macAddress}`}
                    >
                      <span className="constellation-preview-thumb">
                        <LinePreview series={previewSeries} width={68} height={40} />
                        <span className="constellation-preview-hover">
                          <LinePreview series={previewSeries} width={300} height={200} />
                        </span>
                      </span>
                    </button>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="constellation-expanded-row">
                    <td colSpan={7}>
                      <div className="constellation-expanded-panel">
                        <LineAnalysisChart
                          title={`Modulation Profile (MAC ${modem.macAddress})`}
                          subtitle=""
                          yLabel="Shannon Min MER (dB)"
                          showLegend
                          series={modem.profileSeries}
                          xDomain={zoomByKey[modem.key] ?? undefined}
                          enableRangeSelection
                          selection={selectionByKey[modem.key] ?? null}
                          onSelectionChange={(nextSelection) => setSelectionByKey((current) => ({
                            ...current,
                            [modem.key]: nextSelection,
                          }))}
                          selectionActions={(
                            <SpectrumSelectionActions
                              selection={selectionByKey[modem.key] ?? null}
                              hasZoomDomain={(zoomByKey[modem.key] ?? null) !== null}
                              showIntegratedPower={false}
                              onApplyZoom={(domain) => setZoomByKey((current) => ({
                                ...current,
                                [modem.key]: domain,
                              }))}
                              onResetZoom={() => setZoomByKey((current) => ({
                                ...current,
                                [modem.key]: null,
                              }))}
                            />
                          )}
                          exportBaseName={buildExportBaseName(
                            modem.macAddress,
                            modem.captureTimeEpoch,
                            `sg-modulation-profile-sg-${groupId}-channel-${channel.channelId}`,
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

export function ServingGroupModulationProfileResultsView({ payload }: ServingGroupModulationProfileResultsViewProps) {
  const normalized = normalizeServingGroupModulationProfileResultsPayload(payload);

  if (!normalized.serviceGroups.length && normalized.missingModems.length === 0) {
    return <p className="panel-copy">No SG Modulation Profile results available yet.</p>;
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
                  <span>Channel {channel.channelId} · {channel.rangeLabel} · {channel.modems.length} modem(s)</span>
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
