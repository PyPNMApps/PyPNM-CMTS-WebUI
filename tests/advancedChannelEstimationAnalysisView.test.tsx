// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdvancedChannelEstimationAnalysisView } from "@/pages/AdvancedPage";
import type { AdvancedMultiChanEstAnalysisResponse } from "@/types/api";

describe("AdvancedChannelEstimationAnalysisView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders an explicit N/A empty state when no analysis results exist", () => {
    const response = {
      data: {
        results: [],
      },
    } as AdvancedMultiChanEstAnalysisResponse;

    render(<AdvancedChannelEstimationAnalysisView analysisType="min-avg-max" response={response} />);

    expect(screen.getByText("N/A")).toBeTruthy();
    expect(screen.getByText("No analysis results yet. Run analysis to populate this panel.")).toBeTruthy();
  });

  it("renders interpreted channel-estimation views without printing raw JSON", () => {
    const response = {
      device: {
        mac_address: "aa:bb:cc:dd:ee:ff",
        system_description: {
          HW_REV: "1.0",
          VENDOR: "LANCity",
          BOOTR: "NONE",
          SW_REV: "1.0.0",
          MODEL: "LCPET-3",
        },
      },
      data: {
        results: [
          {
            channel_id: 193,
            frequency: [100_000_000, 101_000_000],
            min: [1, 2],
            avg: [2, 3],
            max: [3, 4],
          },
        ],
      },
    } as unknown as AdvancedMultiChanEstAnalysisResponse;

    render(<AdvancedChannelEstimationAnalysisView analysisType="min-avg-max" response={response} />);

    expect(screen.getByText("All Channels · Avg Aligned by Frequency")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Analysis JSON")).toBeNull();
  });
});
