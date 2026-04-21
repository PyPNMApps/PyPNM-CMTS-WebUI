import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import {
  normalizeServingGroupOfdmaPreEqResultsPayload,
  type ServingGroupOfdmaPreEqGroupVisual,
} from "@/pcw/features/serving-group/lib/ofdmaPreEqResults";
import { buildZoomedYDomain } from "@/pcw/features/serving-group/lib/channelEstCoeffZoom";
import { readSelectedModemIpByMac, saveSelectedModemContext } from "@/pw/features/single-capture/lib/selectedModemContext";
import { buildLinePreviewPath, computeLinePreviewBounds } from "@/lib/charts/linePreview";
import { buildExportBaseName } from "@/lib/export/naming";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";

interface ServingGroupOfdmaPreEqResultsViewProps {
  payload: unknown;
}

function formatCmCountLabel(count: number): string {
  return count === 1 ? "1 CM" : `${count} CMs`;
}

function PreviewChart({
  series,
  width,
  height,
  ariaLabel,
}: {
  series: { points: Array<{ x: number; y: number }>; color?: string } | undefined;
  width: number;
  height: number;
  ariaLabel: string;
}) {
  const bounds = useMemo(
    () => computeLinePreviewBounds(series?.points ?? []),
    [series],
  );
  const points = series?.points ?? [];
  const pad = 8;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  const stroke = series?.color ?? "#79a9ff";
  const hasPoints = points.length > 0 && bounds !== null;
  const linePath = hasPoints ? buildLinePreviewPath(points, bounds, width, height, pad) : "";

  return (
    <svg
      className="constellation-preview-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
    >
      <rect x={pad} y={pad} width={innerWidth} height={innerHeight} fill="rgba(255,255,255,0.04)" stroke="rgba(121,169,255,0.55)" />
      {hasPoints ? (
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
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
  channel: ServingGroupOfdmaPreEqGroupVisual["channels"][number];
}) {
  const [combinedSelection, setCombinedSelection] = useState<SpectrumSelectionRange | null>(null);
  const [combinedZoomDomain, setCombinedZoomDomain] = useState<[number, number] | null>(null);
  const [modemSelection, setModemSelection] = useState<Record<string, SpectrumSelectionRange | null>>({});
  const [modemZoomDomain, setModemZoomDomain] = useState<Record<string, [number, number] | null>>({});
  const [groupDelaySelection, setGroupDelaySelection] = useState<Record<string, SpectrumSelectionRange | null>>({});
  const [groupDelayZoomDomain, setGroupDelayZoomDomain] = useState<Record<string, [number, number] | null>>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const numericChannelId = Number.parseInt(channel.channelId, 10);
  const numericGroupId = Number.parseInt(groupId, 10);

  return (
    <article className="analysis-channel-card">
      <div className="analysis-channel-top">
        <h3 className="analysis-channel-title">Channel {channel.channelId}</h3>
        <div className="analysis-channel-meta-line">
          <span>{channel.rangeLabel}</span>
          <span>Spacing: {channel.spacingKhzLabel} kHz</span>
          <span>{formatCmCountLabel(channel.modems.length)}</span>
        </div>
      </div>

      <LineAnalysisChart
        title={`Service Group ${groupId} · Channel ${channel.channelId} · Combined Coefficient Magnitude`}
        subtitle=""
        yLabel="Magnitude (dB)"
        showLegend
        series={channel.combinedCoefficientSeries}
        xDomain={combinedZoomDomain ?? undefined}
        enableRangeSelection
        selection={combinedSelection}
        onSelectionChange={setCombinedSelection}
        selectionActions={(
          <SpectrumSelectionActions
            selection={combinedSelection}
            hasZoomDomain={combinedZoomDomain !== null}
            showIntegratedPower={false}
            onApplyZoom={(domain) => setCombinedZoomDomain(domain)}
            onResetZoom={() => setCombinedZoomDomain(null)}
          />
        )}
        exportBaseName={`sg-ofdma-pre-eq-sg-${groupId}-channel-${channel.channelId}-combined`}
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>MAC Address</th>
              <th>Vendor</th>
              <th>Model</th>
              <th>Version</th>
              <th>Capture Time (UTC)</th>
              <th className="constellation-preview-column">Preview</th>
            </tr>
          </thead>
          <tbody>
            {channel.modems.map((modem) => {
              const isExpanded = expandedKey === modem.key;
              return (
                <Fragment key={modem.key}>
                  <tr>
                    <td className="mono">
                      <Link
                        to="/single-capture/us-ofdma-pre-equalization"
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
                    <td className="constellation-preview-column">
                      <button
                        type="button"
                        className="constellation-preview-button"
                        onClick={() => setExpandedKey((current) => (current === modem.key ? null : modem.key))}
                        aria-expanded={isExpanded}
                        aria-label={`Toggle OFDMA PreEq details for ${modem.macAddress}`}
                      >
                        <span className="constellation-preview-pair-inline">
                          <span className="constellation-preview-thumb">
                            <PreviewChart series={modem.coefficientSeries} width={68} height={40} ariaLabel="OFDMA pre-equalization coefficient preview" />
                            <span className="constellation-preview-hover">
                              <PreviewChart series={modem.coefficientSeries} width={300} height={200} ariaLabel="OFDMA pre-equalization coefficient preview enlarged" />
                            </span>
                          </span>
                          <span className="constellation-preview-thumb">
                            <PreviewChart series={modem.groupDelaySeries} width={68} height={40} ariaLabel="OFDMA pre-equalization group delay preview" />
                            <span className="constellation-preview-hover">
                              <PreviewChart series={modem.groupDelaySeries} width={300} height={200} ariaLabel="OFDMA pre-equalization group delay preview enlarged" />
                            </span>
                          </span>
                        </span>
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="constellation-expanded-row">
                      <td colSpan={6}>
                        <div className="constellation-expanded-panel">
                          <LineAnalysisChart
                            title={`Coefficient Magnitude (MAC ${modem.macAddress})`}
                            subtitle=""
                            yLabel="Magnitude (dB)"
                            showLegend
                            series={[modem.coefficientSeries]}
                            xDomain={modemZoomDomain[modem.key] ?? undefined}
                            enableRangeSelection
                            selection={modemSelection[modem.key] ?? null}
                            onSelectionChange={(nextSelection) => setModemSelection((current) => ({
                              ...current,
                              [modem.key]: nextSelection,
                            }))}
                            selectionActions={(
                              <SpectrumSelectionActions
                                selection={modemSelection[modem.key] ?? null}
                                hasZoomDomain={(modemZoomDomain[modem.key] ?? null) !== null}
                                showIntegratedPower={false}
                                onApplyZoom={(domain) => setModemZoomDomain((current) => ({
                                  ...current,
                                  [modem.key]: domain,
                                }))}
                                onResetZoom={() => setModemZoomDomain((current) => ({
                                  ...current,
                                  [modem.key]: null,
                                }))}
                              />
                            )}
                            exportBaseName={buildExportBaseName(
                              modem.macAddress,
                              modem.captureTimeEpoch,
                              `sg-ofdma-pre-eq-sg-${groupId}-channel-${channel.channelId}`,
                            )}
                          />
                          {modem.groupDelaySeries ? (
                            <LineAnalysisChart
                              title={`Group Delay (MAC ${modem.macAddress})`}
                              subtitle=""
                              yLabel="Group Delay"
                              showLegend={false}
                              series={[modem.groupDelaySeries]}
                              xDomain={groupDelayZoomDomain[modem.key] ?? undefined}
                              yDomain={buildZoomedYDomain(modem.groupDelaySeries, groupDelayZoomDomain[modem.key] ?? null)}
                              enableRangeSelection
                              selection={groupDelaySelection[modem.key] ?? null}
                              onSelectionChange={(nextSelection) => setGroupDelaySelection((current) => ({
                                ...current,
                                [modem.key]: nextSelection,
                              }))}
                              selectionActions={(
                                <SpectrumSelectionActions
                                  selection={groupDelaySelection[modem.key] ?? null}
                                  hasZoomDomain={(groupDelayZoomDomain[modem.key] ?? null) !== null}
                                  showIntegratedPower={false}
                                  onApplyZoom={(domain) => setGroupDelayZoomDomain((current) => ({
                                    ...current,
                                    [modem.key]: domain,
                                  }))}
                                  onResetZoom={() => setGroupDelayZoomDomain((current) => ({
                                    ...current,
                                    [modem.key]: null,
                                  }))}
                                />
                              )}
                              exportBaseName={buildExportBaseName(
                                modem.macAddress,
                                modem.captureTimeEpoch,
                                `sg-ofdma-pre-eq-group-delay-sg-${groupId}-channel-${channel.channelId}`,
                              )}
                            />
                          ) : null}
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

export function ServingGroupOfdmaPreEqResultsView({ payload }: ServingGroupOfdmaPreEqResultsViewProps) {
  const normalized = normalizeServingGroupOfdmaPreEqResultsPayload(payload);

  if (!normalized.serviceGroups.length && normalized.missingModems.length === 0) {
    return <p className="panel-copy">No SG OFDMA PreEq results available yet.</p>;
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
                  <span>Channel {channel.channelId} · {channel.rangeLabel} · Spacing: {channel.spacingKhzLabel} kHz · {formatCmCountLabel(channel.modems.length)}</span>
                </summary>
                <ChannelSection groupId={group.serviceGroupId} channel={channel} />
              </details>
            ))}
          </div>
        </details>
      ))}
      {normalized.missingModems.length > 0 ? (
        <details className="chart-frame capture-request-dropdown">
          <summary className="capture-request-dropdown-summary">
            <span>Excluded Cable Modems ({normalized.missingModems.length})</span>
          </summary>
          <div className="analysis-channel-meta-line">
            <span>MACs omitted from visuals due to missing or unusable data</span>
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
        </details>
      ) : null}
    </div>
  );
}
