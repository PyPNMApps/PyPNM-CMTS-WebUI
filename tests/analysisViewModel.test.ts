import { describe, expect, it } from "vitest";

import { buildCombinedSeries, summarizeAnalysis, summarizeChannel } from "@/pw/features/analysis/analysisViewModel";
import { rxmerEchoFixture } from "@/pw/features/analysis/fixtures/rxmerEchoFixture";

describe("analysisViewModel", () => {
  it("summarizes channel metrics from averaged RxMER values", () => {
    const summary = summarizeChannel(rxmerEchoFixture.channels[2]);

    expect(summary.min).toBe(45.5);
    expect(summary.max).toBe(47.4);
    expect(summary.avg).toBeCloseTo(46.49, 2);
  });

  it("builds analysis rollups by state", () => {
    const summary = summarizeAnalysis(rxmerEchoFixture.channels);

    expect(summary.channelCount).toBe(3);
    expect(summary.echoChannels).toBe(1);
    expect(summary.standingWaveChannels).toBe(1);
    expect(summary.cleanChannels).toBe(1);
    expect(summary.totalEchoes).toBe(2);
  });

  it("creates combined chart series for each channel", () => {
    const series = buildCombinedSeries(rxmerEchoFixture.channels);

    expect(series).toHaveLength(3);
    expect(series[0]?.label).toBe("Channel 34");
    expect(series[1]?.points[0]).toEqual({ x: 325, y: 47.3 });
  });
});
