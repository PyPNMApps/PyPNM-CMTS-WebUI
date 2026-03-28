import { describe, expect, it } from "vitest";

import { selectionToZoomDomain } from "@/lib/spectrumZoom";

describe("selectionToZoomDomain", () => {
  it("returns a normalized min/max domain", () => {
    expect(selectionToZoomDomain({ startX: 640, endX: 620 })).toEqual([620, 640]);
  });

  it("returns null for missing or degenerate selections", () => {
    expect(selectionToZoomDomain(null)).toBeNull();
    expect(selectionToZoomDomain({ startX: 620, endX: 620 })).toBeNull();
    expect(selectionToZoomDomain({ startX: Number.NaN, endX: 620 })).toBeNull();
  });
});

