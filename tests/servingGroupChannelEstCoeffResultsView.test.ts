import { describe, expect, it } from "vitest";
import { buildZoomedYDomain } from "../src/pcw/features/serving-group/lib/channelEstCoeffZoom";

describe("buildZoomedYDomain", () => {
  it("builds a y-domain from selected x-range with 15% margin", () => {
    const series = {
      label: "Group Delay",
      color: "#f1c75b",
      points: [
        { x: 0, y: 10 },
        { x: 1, y: 15 },
        { x: 2, y: 30 },
        { x: 3, y: 35 },
      ],
    };

    const yDomain = buildZoomedYDomain(series, [1, 2]);
    expect(yDomain).toBeDefined();
    const [minY, maxY] = yDomain as [number, number];
    expect(minY).toBeCloseTo(12.75, 2);
    expect(maxY).toBeCloseTo(32.25, 2);
  });
});
