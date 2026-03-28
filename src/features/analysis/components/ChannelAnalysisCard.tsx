import { buildSeries, formatFixed, summarizeChannel } from "@/features/analysis/analysisViewModel";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import type { AnalysisChannel } from "@/features/analysis/types";

interface ChannelAnalysisCardProps {
  channel: AnalysisChannel;
  color: string;
}

export function ChannelAnalysisCard({ channel, color }: ChannelAnalysisCardProps) {
  const summary = summarizeChannel(channel);
  const chartSeries = [buildSeries(channel, color)];

  return (
    <article className="analysis-channel-card">
      <div className="analysis-channel-top">
        <h3 className="analysis-channel-title">Channel {channel.channelId}</h3>
        <div className="analysis-channel-range">
          {formatFixed(channel.frequency[0], 1)} - {formatFixed(channel.frequency[channel.frequency.length - 1], 1)} MHz
        </div>
      </div>

      <div className="analysis-channel-body">
        <div className="analysis-meta-strip">
          <span className={`analysis-state-badge ${channel.stateClass}`}>{channel.state}</span>
          <span className="analysis-chip">
            <b>Captures</b> {channel.captures}
          </span>
          <span className="analysis-chip">
            <b>VF</b> {formatFixed(channel.velocityFactor, 2)}
          </span>
          <span className="analysis-chip">
            <b>Notches</b> {channel.notchCount}
          </span>
        </div>

        <div className="analysis-small-metrics">
          <div className="analysis-small-metric">
            <div className="analysis-small-k">Avg RxMER</div>
            <div className="analysis-small-v">{formatFixed(summary.avg, 2)} dB</div>
          </div>
          <div className="analysis-small-metric">
            <div className="analysis-small-k">Ripple P2P</div>
            <div className="analysis-small-v">{formatFixed(channel.rippleP2PDb, 2)} dB</div>
          </div>
          <div className="analysis-small-metric">
            <div className="analysis-small-k">Echo Count</div>
            <div className="analysis-small-v">{channel.echoCount}</div>
          </div>
        </div>

        <LineAnalysisChart
          title="RxMER Avg"
          subtitle="Derived from the averaged capture set"
          yLabel="RxMER (dB)"
          series={chartSeries}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Rank</th>
                <th>Delay (us)</th>
                <th>Distance (m)</th>
                <th>Distance (ft)</th>
                <th>Amplitude</th>
              </tr>
            </thead>
            <tbody>
              {channel.echoes.map((echo) => (
                <tr key={`${channel.channelId}-${echo.rank}-${echo.type}`}>
                  <td>{echo.type}</td>
                  <td>{echo.rank}</td>
                  <td>{formatFixed(echo.delayUs, 3)}</td>
                  <td>{formatFixed(echo.distanceM, 2)}</td>
                  <td>{formatFixed(echo.distanceFt, 2)}</td>
                  <td>{formatFixed(echo.amplitude, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}
