import { Panel } from "@/components/common/Panel";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { buildCombinedSeries, formatFixed, summarizeAnalysis } from "@/pw/features/analysis/analysisViewModel";
import { ChannelAnalysisCard } from "@/pw/features/analysis/components/ChannelAnalysisCard";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import type { RxMerEchoAnalysisFixture } from "@/pw/features/analysis/types";

interface RxMerEchoAnalysisViewProps {
  fixture: RxMerEchoAnalysisFixture;
  showHero?: boolean;
}

export function RxMerEchoAnalysisView({ fixture, showHero = true }: RxMerEchoAnalysisViewProps) {
  const summary = summarizeAnalysis(fixture.channels);
  const combinedSeries = buildCombinedSeries(fixture.channels);

  return (
    <>
      {showHero ? (
        <section className="analysis-hero">
          <div className="analysis-hero-top">
            <div>
              <div className="analysis-eyebrow">Fixture-backed analysis implementation</div>
              <h1 className="analysis-hero-title">RxMER Echo Analysis</h1>
              <p className="analysis-hero-subtitle">
                The analysis route now renders a real engineering dashboard baseline using reusable components and typed
                data instead of a placeholder panel.
              </p>
            </div>
            <div className="analysis-status-stack">
              <div className="status-chip-row">
                <span className="analysis-chip ok">
                  <b>Status</b> {fixture.status}
                </span>
                <span className="analysis-chip mono">
                  <b>Group</b> {fixture.requestContext.captureGroup}
                </span>
              </div>
              <div className="status-chip-row">
                <span className="analysis-chip">
                  <b>Analysis</b> {fixture.requestContext.analysis}
                </span>
                <span className="analysis-chip">
                  <b>Capture Time</b> {fixture.requestContext.captureTime}
                </span>
              </div>
            </div>
          </div>

          <div className="analysis-summary-grid">
            <div className="analysis-metric-card">
              <div className="analysis-metric-label">Channels</div>
              <div className="analysis-metric-value">{summary.channelCount}</div>
              <div className="analysis-metric-help">Aligned downstream OFDM channels in view</div>
            </div>
            <div className="analysis-metric-card">
              <div className="analysis-metric-label">Echo Channels</div>
              <div className="analysis-metric-value">{summary.echoChannels}</div>
              <div className="analysis-metric-help">{summary.totalEchoes} ranked echoes across channels</div>
            </div>
            <div className="analysis-metric-card">
              <div className="analysis-metric-label">Standing Wave Likely</div>
              <div className="analysis-metric-value">{summary.standingWaveChannels}</div>
              <div className="analysis-metric-help">Flagged by ripple and notch heuristics</div>
            </div>
            <div className="analysis-metric-card">
              <div className="analysis-metric-label">Clean Channels</div>
              <div className="analysis-metric-value">{summary.cleanChannels}</div>
              <div className="analysis-metric-help">No echo and no standing-wave flag</div>
            </div>
          </div>
        </section>
      ) : null}

      <Panel title="Device Context">
        <p className="panel-copy">Keep operator context visible before interpretation.</p>
        <DeviceInfoTable deviceInfo={fixture.deviceInfo} />
      </Panel>

      <Panel title="Combined Analysis View">
        <p className="panel-copy">
          Cross-channel comparison comes first, followed by per-channel evidence cards. This mirrors the strongest
          `visual/PyPNM` Postman patterns in a reusable web UI shape.
        </p>
        <LineAnalysisChart
          title="All Channels"
          subtitle="RxMER average aligned by frequency"
          yLabel="RxMER (dB)"
          series={combinedSeries}
        />
      </Panel>

      <Panel title="Per-Channel Evidence">
        <p className="panel-copy">
          Each card exposes state classification, summary metrics, the channel curve, and echo table evidence.
        </p>
        <div className="analysis-channels-grid">
          {fixture.channels.map((channel, index) => (
            <ChannelAnalysisCard key={channel.channelId} channel={channel} color={combinedSeries[index]?.color ?? "#79a9ff"} />
          ))}
        </div>
      </Panel>

      <Panel title="Raw Response">
        <p className="panel-copy">Interpreted visuals and raw payload visibility should coexist on every analysis route.</p>
        <details className="analysis-raw-json">
          <summary>Show JSON fixture</summary>
          <pre>{JSON.stringify(fixture, null, 2)}</pre>
        </details>
        <div className="analysis-footnote">
          Endpoint: <span className="mono">{fixture.requestContext.endpoint}</span>
          {" · "}Sample rate: {formatFixed(fixture.channels[0]?.sampleRateMHz ?? 0, 1)} MHz
        </div>
      </Panel>
    </>
  );
}
