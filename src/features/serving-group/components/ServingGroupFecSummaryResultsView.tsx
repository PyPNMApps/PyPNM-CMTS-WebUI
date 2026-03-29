import { FecChannelChart } from "@/features/operations/FecChannelChart";
import {
  normalizeServingGroupFecSummaryResultsPayload,
  type ServingGroupFecSummaryGroupVisual,
} from "@/features/serving-group/lib/fecSummaryResults";
import { buildExportBaseName } from "@/lib/export/naming";

interface ServingGroupFecSummaryResultsViewProps {
  payload: unknown;
}

function formatCmCountLabel(count: number): string {
  return count === 1 ? "1 CM" : `${count} CMs`;
}

function ChannelSection({
  groupId,
  channel,
}: {
  groupId: string;
  channel: ServingGroupFecSummaryGroupVisual["channels"][number];
}) {
  const modemGridClassName = channel.modems.length === 1
    ? "analysis-channels-grid analysis-channels-grid-single"
    : "analysis-channels-grid";

  return (
    <article className="analysis-channel-card">
      <div className="analysis-channel-top">
        <h3 className="analysis-channel-title">Channel {channel.channelId}</h3>
        <div className="analysis-channel-meta-line">
          <span>{formatCmCountLabel(channel.modems.length)}</span>
        </div>
      </div>
      <div className={modemGridClassName}>
        {channel.modems.map((modem) => (
          <article key={modem.key} className="analysis-channel-card">
            <div className="analysis-channel-top">
              <h4 className="analysis-channel-title">{modem.modelLabel} · {modem.macAddress}</h4>
              <div className="analysis-channel-meta-line">
                <span>{modem.captureTimeLabel}</span>
                <span>Profiles: {modem.profiles.length}</span>
              </div>
            </div>
            <FecChannelChart
              title={`FEC Summary (MAC ${modem.macAddress})`}
              profiles={modem.profiles}
              exportBaseName={buildExportBaseName(
                modem.macAddress,
                modem.captureTimeEpoch,
                `sg-fec-summary-sg-${groupId}-channel-${channel.channelId}`,
              )}
            />
          </article>
        ))}
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
