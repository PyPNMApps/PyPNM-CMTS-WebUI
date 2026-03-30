import { describe, expect, it } from "vitest";

import { buildLinePreviewPath, computeLinePreviewBounds } from "@/lib/charts/linePreview";

describe("linePreview math helpers", () => {
  it("computes bounds with padding for line preview points", () => {
    const bounds = computeLinePreviewBounds([
      { x: 100, y: 45.5 },
      { x: 101, y: 46.2 },
      { x: 102, y: 45.9 },
    ]);

    expect(bounds).not.toBeNull();
    expect((bounds?.minX ?? 0)).toBeLessThan(100);
    expect((bounds?.maxX ?? 0)).toBeGreaterThan(102);
    expect((bounds?.minY ?? 0)).toBeLessThan(45.5);
    expect((bounds?.maxY ?? 0)).toBeGreaterThan(46.2);
  });

  it("builds a valid svg path for bounded points", () => {
    const points = [
      { x: 100, y: 45.5 },
      { x: 101, y: 46.2 },
      { x: 102, y: 45.9 },
    ];
    const bounds = computeLinePreviewBounds(points);
    const path = buildLinePreviewPath(points, bounds, 110, 68, 8);

    expect(path.startsWith("M ")).toBe(true);
    expect(path.includes("L ")).toBe(true);
  });

  it("returns empty path when bounds are missing", () => {
    const path = buildLinePreviewPath([], null, 110, 68, 8);
    expect(path).toBe("");
  });
});
