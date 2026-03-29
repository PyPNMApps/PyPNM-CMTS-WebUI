import { useState } from "react";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import type { ChartSeries } from "@/pw/features/analysis/types";
import {
  normalizeServingGroupChannelEstCoeffResultsPayload,
  type ServingGroupChannelEstCoeffGroupVisual,
} from "@/pcw/features/serving-group/lib/channelEstCoeffResults";
import { buildExportBaseName } from "@/lib/export/naming";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";

interface ServingGroupChannelEstCoeffResultsViewProps {
  payload: unknown;
}

function formatCmCountLabel(count: number): string {
  return count === 1 ? "1 CM" : `${count} CMs`;
}

export function buildZoomedYDomain(series: ChartSeries | undefined, xDomain: [number, number] | null): [number, number] | undefined {
  if (!series || !xDomain) {
    return undefined;
  }

  const [minX, maxX] = xDomain[0] <= xDomain[1] ? xDomain : [xDomain[1], xDomain[0]];
  const selectedYValues = series.points
    .filter((point) => point.x >= minX && point.x <= maxX)
    .map((point) => point.y)
    .filter((value) => Number.isFinite(value));

  if (!selectedYValues.length) {
    return undefined;
  }

  const selectedMin = Math.min(...selectedYValues);
  const selectedMax = Math.max(...selectedYValues);
  const selectedSpan = selectedMax - selectedMin;
  const padding = (selectedSpan || 1) * 0.15;
  return [selectedMin - padding, selectedMax + padding];
}

function ChannelSection({
  groupId,
  channel,
}: {
  groupId: string;
  channel: ServingGroupChannelEstCoeffGroupVisual["channels"][number];
}) {
  const [combinedSelection, setCombinedSelection] = useState<SpectrumSelectionRange | null>(null);
  const [combinedZoomDomain, setCombinedZoomDomain] = useState<[number, number] | null>(null);
  const [modemSelection, setModemSelection] = useState<Record<string, SpectrumSelectionRange | null>>({});
  const [modemZoomDomain, setModemZoomDomain] = useState<Record<string, [number, number] | null>>({});
  const [groupDelaySelection, setGroupDelaySelection] = useState<Record<string, SpectrumSelectionRange | null>>({});
  const [groupDelayZoomDomain, setGroupDelayZoomDomain] = useState<Record<string, [number, number] | null>>({});

  const modemGridClassName = channel.modems.length === 1
    ? "analysis-channels-grid analysis-channels-grid-single"
    : "analysis-channels-grid";

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
        title={`Service Group ${groupId} · Channel ${channel.channelId} · Combined Magnitude`}
        subtitle=""
        yLabel="Magnitude (dB)"
        showLegend
        series={channel.combinedMagnitudeSeries}
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
        exportBaseName={`sg-channel-est-coeff-sg-${groupId}-channel-${channel.channelId}-combined`}
      />

      <div className={modemGridClassName}>
        {channel.modems.map((modem) => (
          <article key={modem.key} className="analysis-channel-card">
            <div className="analysis-channel-top">
              <h4 className="analysis-channel-title">{modem.modelLabel} · {modem.macAddress}</h4>
              <div className="analysis-channel-meta-line">
                <span>{modem.captureTimeLabel}</span>
              </div>
            </div>
            <LineAnalysisChart
              title={`Magnitude (MAC ${modem.macAddress})`}
              subtitle=""
              yLabel="Magnitude (dB)"
              showLegend
              series={[modem.magnitudeSeries]}
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
                `sg-channel-est-coeff-sg-${groupId}-channel-${channel.channelId}`,
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
                  `sg-channel-est-coeff-group-delay-sg-${groupId}-channel-${channel.channelId}`,
                )}
              />
            ) : null}
          </article>
        ))}
      </div>
    </article>
  );
}

export function ServingGroupChannelEstCoeffResultsView({ payload }: ServingGroupChannelEstCoeffResultsViewProps) {
  const normalized = normalizeServingGroupChannelEstCoeffResultsPayload(payload);

  if (!normalized.serviceGroups.length && normalized.missingModems.length === 0) {
    return <p className="panel-copy">No SG Channel Estimation results available yet.</p>;
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
