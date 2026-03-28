import { describe, expect, it } from "vitest";

import {
  buildRxMerDistributionBins,
  buildRxMerSelectionInsights,
  collectSelectedRxMerValues,
  collectSelectedRxMerValuesFromSeries,
  estimateBitloadFromMerDb,
  inferErrorFreeQamFromMerDb,
} from "@/lib/rxMerSelectionInsights";

describe("rxMerSelectionInsights", () => {
  it("collects selected MER values by selected frequency range", () => {
    const selected = collectSelectedRxMerValues(
      [100_000_000, 101_000_000, 102_000_000, 103_000_000],
      [35.1, 36.2, 37.3, 38.4],
      { startX: 100.5, endX: 102.5 },
    );

    expect(selected).toEqual([36.2, 37.3]);
  });

  it("collects selected MER values from chart series for combined overlays", () => {
    const selected = collectSelectedRxMerValuesFromSeries(
      [
        {
          label: "Channel 1",
          color: "#79a9ff",
          points: [{ x: 100, y: 35 }, { x: 101, y: 36 }],
        },
        {
          label: "Channel 2",
          color: "#58d0a7",
          points: [{ x: 100.5, y: 37 }, { x: 101.5, y: 38 }],
        },
      ],
      { startX: 100.4, endX: 101.2 },
    );

    expect(selected).toEqual([36, 37]);
  });

  it("estimates bitload from MER and clamps to a practical range", () => {
    expect(estimateBitloadFromMerDb(0)).toBeGreaterThanOrEqual(0);
    expect(estimateBitloadFromMerDb(100)).toBeLessThanOrEqual(12);
  });

  it("infers conservative error-free QAM from minimum MER", () => {
    expect(inferErrorFreeQamFromMerDb(46)).toBe("QAM-4096");
    expect(inferErrorFreeQamFromMerDb(39)).toBe("QAM-1024");
    expect(inferErrorFreeQamFromMerDb(30)).toBe("Below QAM-256");
  });

  it("builds MER distribution bins with all values accounted for", () => {
    const values = [35, 35.5, 36, 37, 38, 38.5];
    const bins = buildRxMerDistributionBins(values, 6);
    const total = bins.reduce((sum, bin) => sum + bin.count, 0);

    expect(bins.length).toBe(6);
    expect(total).toBe(values.length);
  });

  it("builds selection insights with summary metrics and distribution", () => {
    const insights = buildRxMerSelectionInsights([35.2, 36.1, 38.4, 39.5]);

    expect(insights).not.toBeNull();
    expect(insights?.pointCount).toBe(4);
    expect(insights?.avgMerDb).toBeGreaterThan(0);
    expect(insights?.estimatedBitloadBitsPerSymbol).toBeGreaterThan(0);
    expect(insights?.safeQamLabel).toContain("QAM");
    expect(insights?.distributionBins.length).toBeGreaterThan(0);
  });
});
