import type {
  AnalysisChannel,
  AnalysisSummary,
  ChartSeries,
  ChannelMetricSummary,
} from "@/features/analysis/types";

const palette = ["#79a9ff", "#58d0a7", "#ff7a6b", "#f1c75b", "#bb8cff"] as const;

export function formatFixed(value: number, digits: number): string {
  return value.toFixed(digits);
}

export function summarizeChannel(channel: AnalysisChannel): ChannelMetricSummary {
  const avg = channel.avg.reduce((sum, value) => sum + value, 0) / channel.avg.length;

  return {
    avg,
    min: Math.min(...channel.avg),
    max: Math.max(...channel.avg),
  };
}

export function summarizeAnalysis(channels: AnalysisChannel[]): AnalysisSummary {
  return channels.reduce<AnalysisSummary>(
    (summary, channel) => ({
      channelCount: summary.channelCount + 1,
      echoChannels: summary.echoChannels + (channel.stateClass === "warn" ? 1 : 0),
      standingWaveChannels: summary.standingWaveChannels + (channel.stateClass === "maybe" ? 1 : 0),
      cleanChannels: summary.cleanChannels + (channel.stateClass === "ok" ? 1 : 0),
      totalEchoes: summary.totalEchoes + channel.echoCount,
    }),
    {
      channelCount: 0,
      echoChannels: 0,
      standingWaveChannels: 0,
      cleanChannels: 0,
      totalEchoes: 0,
    },
  );
}

export function buildSeries(channel: AnalysisChannel, color: string): ChartSeries {
  return {
    label: `Channel ${channel.channelId}`,
    color,
    points: channel.frequency.map((frequency, index) => ({ x: frequency, y: channel.avg[index] })),
  };
}

export function buildCombinedSeries(channels: AnalysisChannel[]): ChartSeries[] {
  return channels.map((channel, index) => buildSeries(channel, palette[index % palette.length]));
}
