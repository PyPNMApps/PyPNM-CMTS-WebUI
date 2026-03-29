// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvancedRxMerHeatMapView } from "@/pw/features/advanced/AdvancedRxMerHeatMapView";
import type { AdvancedMultiRxMerAnalysisResponse } from "@/types/api";

const frequency = Array.from({ length: 256 }, (_, index) => 615000000 + index * 50000);
const rowA = Array.from({ length: 256 }, (_, index) => 34 + index * 0.01);
const rowB = Array.from({ length: 256 }, (_, index) => 35 + index * 0.01);

const responseFixture: AdvancedMultiRxMerAnalysisResponse = {
  status: "success",
  message: null,
  mac_address: "FC:77:7B:0B:1B:E0",
  device: {
    mac_address: "FC:77:7B:0B:1B:E0",
    system_description: {
      HW_REV: "1A",
      VENDOR: "Hitron",
      BOOTR: "1.0",
      SW_REV: "2.0",
      MODEL: "CODA",
    },
  },
  data: {
    "193": {
      channel_id: 193,
      frequency,
      timestamps: [1710000000, 1710000030],
      values: [rowA, rowB],
    },
  },
};

describe("AdvancedRxMerHeatMapView", () => {
  it("renders the full heat map width with dense pixel cells a left MER scale and an x-axis frequency scale", () => {
    const { container } = render(<AdvancedRxMerHeatMapView response={responseFixture} />);

    const grid = screen.getByTestId("advanced-rxmer-heatmap-grid");
    const scale = screen.getByTestId("advanced-rxmer-heatmap-scale");
    const axis = screen.getByTestId("advanced-rxmer-heatmap-axis");
    expect(grid.getAttribute("style")).toContain("repeat(256, 1px)");
    expect(container.querySelectorAll(".advanced-heatmap-cell").length).toBe(512);
    expect(scale.textContent).toContain("MER");
    expect(scale.textContent).toContain("37.5 dB");
    expect(scale.textContent).toContain("35.8");
    expect(scale.textContent).toContain("34.0 dB");
    expect(axis.textContent).toContain("615.0 MHz");
    expect(axis.textContent).toContain("621.4 MHz");
    expect(axis.textContent).toContain("627.8 MHz");
  });
});
