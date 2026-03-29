import { Fragment, useMemo, useState } from "react";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import { HistogramBarChart } from "@/features/operations/HistogramBarChart";
import {
  normalizeServingGroupHistogramResultsPayload,
  type ServingGroupHistogramModemVisual,
} from "@/features/serving-group/lib/histogramResults";
import { buildExportBaseName } from "@/lib/export/naming";

interface ServingGroupHistogramResultsViewProps {
  payload: unknown;
}

function buildPreviewPoints(values: number[]) {
  return values.map((value, index) => ({ x: index, y: value }));
}

function HistogramPreview({
  values,
  width,
  height,
}: {
  values: number[];
  width: number;
  height: number;
}) {
  const points = buildPreviewPoints(values);
  const maxX = Math.max(points.length - 1, 1);
  const maxY = Math.max(...values, 1);
  const pad = 8;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  const barWidth = innerWidth / Math.max(values.length, 1);

  return (
    <svg
      className="constellation-preview-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Histogram preview"
    >
      <rect x={pad} y={pad} width={innerWidth} height={innerHeight} fill="rgba(255,255,255,0.04)" stroke="rgba(121,169,255,0.55)" />
      {values.map((value, index) => {
        const x = pad + (index / maxX) * innerWidth;
        const barHeight = (value / maxY) * innerHeight;
        const y = pad + innerHeight - barHeight;
        return (
          <rect
            key={`${index}-${value}`}
            x={x}
            y={y}
            width={Math.max(barWidth - 1, 1)}
            height={barHeight}
            fill="rgba(0, 194, 255, 0.45)"
            stroke="rgba(0, 194, 255, 0.95)"
            strokeWidth="0.8"
          />
        );
      })}
      {points.length === 0 ? (
        <text x="50%" y="54%" textAnchor="middle" className="constellation-preview-empty-label">No Data</text>
      ) : null}
    </svg>
  );
}

function HistogramResultsTable({
  modems,
}: {
  modems: ServingGroupHistogramModemVisual[];
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>SG</th>
            <th>MAC Address</th>
            <th>Model</th>
            <th>Vendor</th>
            <th>Version</th>
            <th>Channel</th>
            <th>Capture Time (UTC)</th>
            <th className="constellation-preview-column">Preview</th>
          </tr>
        </thead>
        <tbody>
          {modems.map((modem) => {
            const isExpanded = expandedKey === modem.key;
            return (
              <Fragment key={modem.key}>
                <tr>
                  <td>{modem.serviceGroupId}</td>
                  <td className="mono">{modem.macAddress}</td>
                  <td>{modem.model}</td>
                  <td>{modem.vendor}</td>
                  <td>{modem.softwareVersion}</td>
                  <td>{modem.channelId}</td>
                  <td>{modem.captureTimeLabel}</td>
                  <td className="constellation-preview-column">
                    <button
                      type="button"
                      className="constellation-preview-button"
                      onClick={() => setExpandedKey((current) => (current === modem.key ? null : modem.key))}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle histogram details for ${modem.macAddress}`}
                    >
                      <span className="constellation-preview-thumb">
                        <HistogramPreview values={modem.hitCounts} width={68} height={40} />
                        <span className="constellation-preview-hover">
                          <HistogramPreview values={modem.hitCounts} width={300} height={200} />
                        </span>
                      </span>
                    </button>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="constellation-expanded-row">
                    <td colSpan={8}>
                      <div className="constellation-expanded-panel">
                        <HistogramBarChart
                          title={`Histogram (MAC ${modem.macAddress}, SG ${modem.serviceGroupId})`}
                          values={modem.hitCounts}
                          exportBaseName={buildExportBaseName(
                            modem.macAddress,
                            modem.captureTimeEpoch,
                            `sg-histogram-sg-${modem.serviceGroupId}`,
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

export function ServingGroupHistogramResultsView({ payload }: ServingGroupHistogramResultsViewProps) {
  const normalized = normalizeServingGroupHistogramResultsPayload(payload);
  const [selectedMacs, setSelectedMacs] = useState<string[]>(() => normalized.modems.map((modem) => modem.macAddress));
  const selectedMacSet = useMemo(() => new Set(selectedMacs), [selectedMacs]);

  const selectedModems = useMemo(
    () => normalized.modems.filter((modem) => selectedMacSet.has(modem.macAddress)),
    [normalized.modems, selectedMacSet],
  );

  const combinedSeries = useMemo(
    () => normalized.combinedSeries.filter((series) => selectedMacSet.has(series.label.split(" · ")[0] ?? "")),
    [normalized.combinedSeries, selectedMacSet],
  );

  if (!normalized.modems.length && normalized.missingModems.length === 0) {
    return <p className="panel-copy">No SG Histogram results available yet.</p>;
  }

  return (
    <div className="operations-visual-stack">
      {normalized.modems.length > 0 ? (
        <article className="analysis-channel-card">
          <div className="analysis-channel-top">
            <h3 className="analysis-channel-title">Combined Histogram Preview</h3>
            <div className="analysis-channel-meta-line">
              <span>Selected Modems: {selectedModems.length} of {normalized.modems.length}</span>
              <span>Flat preview across serving groups</span>
            </div>
          </div>
          <div className="analysis-channel-body">
            <LineAnalysisChart
              title="Combined Histogram Traces"
              subtitle=""
              yLabel="Hit Count"
              showLegend={false}
              series={combinedSeries}
              exportBaseName="sg-histogram-combined-preview"
            />
            <details className="capture-request-dropdown">
              <summary className="capture-request-dropdown-summary">
                <span>Cable Modem Filter</span>
                <span className="capture-request-group-meta">Select MACs included in combined preview</span>
              </summary>
              <div className="status-chip-row">
                <button
                  type="button"
                  className="analysis-chip-button"
                  disabled={normalized.modems.length === 0}
                  onClick={() => setSelectedMacs(normalized.modems.map((modem) => modem.macAddress))}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="analysis-chip-button"
                  disabled={selectedMacs.length === 0}
                  onClick={() => setSelectedMacs([])}
                >
                  Unselect All
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>SG</th>
                      <th>MAC Address</th>
                      <th>Model</th>
                      <th>Vendor</th>
                      <th>Version</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalized.modems.map((modem) => (
                      <tr key={`filter-${modem.key}`}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedMacSet.has(modem.macAddress)}
                            onChange={() => {
                              setSelectedMacs((current) => (
                                current.includes(modem.macAddress)
                                  ? current.filter((entry) => entry !== modem.macAddress)
                                  : [...current, modem.macAddress].sort((left, right) => left.localeCompare(right))
                              ));
                            }}
                            aria-label={`Toggle ${modem.macAddress} in combined graph`}
                          />
                        </td>
                        <td>{modem.serviceGroupId}</td>
                        <td className="mono">{modem.macAddress}</td>
                        <td>{modem.model}</td>
                        <td>{modem.vendor}</td>
                        <td>{modem.softwareVersion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <details className="capture-request-dropdown" open>
              <summary className="capture-request-dropdown-summary">
                <span>Histogram Previews</span>
                <span className="capture-request-group-meta">Flat modem list (no SG grouping)</span>
              </summary>
              <HistogramResultsTable modems={selectedModems} />
            </details>
          </div>
        </article>
      ) : null}
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
                  <th>MAC Address</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {normalized.missingModems.map((entry) => (
                  <tr key={entry.key}>
                    <td>{entry.serviceGroupId}</td>
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

