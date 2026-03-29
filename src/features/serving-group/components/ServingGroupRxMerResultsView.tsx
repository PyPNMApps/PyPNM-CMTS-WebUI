import { useState } from "react";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import { ModulationCountsChart } from "@/features/operations/ModulationCountsChart";
import {
  normalizeServingGroupRxMerResultsPayload,
  type ServingGroupRxMerGroupVisual,
} from "@/features/serving-group/lib/rxmerResults";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";

interface ServingGroupRxMerResultsViewProps {
  payload: unknown;
}

function formatCmCountLabel(count: number): string {
  return count === 1 ? "1 CM" : `${count} CMs`;
}

function ChannelSection({ groupId, channel }: { groupId: string; channel: ServingGroupRxMerGroupVisual["channels"][number] }) {
  const [combinedSelection, setCombinedSelection] = useState<SpectrumSelectionRange | null>(null);
  const [combinedZoomDomain, setCombinedZoomDomain] = useState<[number, number] | null>(null);
  const [modemSelection, setModemSelection] = useState<Record<string, SpectrumSelectionRange | null>>({});
  const [modemZoomDomain, setModemZoomDomain] = useState<Record<string, [number, number] | null>>({});
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

      {channel.combinedSeries.length > 0 ? (
        <LineAnalysisChart
          title={`Service Group ${groupId} · Channel ${channel.channelId} · Combined RxMER`}
          subtitle=""
          yLabel="RxMER (dB)"
          showLegend
          series={channel.combinedSeries}
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
          exportBaseName={`sg-rxmer-sg-${groupId}-channel-${channel.channelId}-combined`}
        />
      ) : (
        <p className="panel-copy">No combined RxMER series available.</p>
      )}

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
              title={`RxMER (MAC ${modem.macAddress})`}
              subtitle=""
              yLabel="RxMER (dB)"
              showLegend
              series={modem.rxMerSeries}
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
              exportBaseName={`sg-rxmer-sg-${groupId}-channel-${channel.channelId}-mac-${modem.macAddress.replaceAll(":", "")}`}
            />
            <ModulationCountsChart
              title={`Supported Modulation Counts (MAC ${modem.macAddress})`}
              counts={modem.modulationCounts}
              exportBaseName={`sg-rxmer-modulation-sg-${groupId}-channel-${channel.channelId}-mac-${modem.macAddress.replaceAll(":", "")}`}
            />
          </article>
        ))}
      </div>
    </article>
  );
}

export function ServingGroupRxMerResultsView({ payload }: ServingGroupRxMerResultsViewProps) {
  const normalized = normalizeServingGroupRxMerResultsPayload(payload);

  if (!normalized.serviceGroups.length && normalized.missingModems.length === 0) {
    return <p className="panel-copy">No SG RxMER results available yet.</p>;
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
