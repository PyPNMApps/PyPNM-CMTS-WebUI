// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvancedRxMerProfilePerformanceView } from "@/pw/features/advanced/AdvancedRxMerProfilePerformanceView";
import type { AdvancedMultiRxMerAnalysisResponse } from "@/types/api";

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
      frequency: [615000000, 615050000, 615100000],
      avg_mer: [36.1, 36.2, 36.3],
      mer_shannon_limits: [39.1, 39.2, 39.3],
      profiles: [
        {
          profile_id: 1,
          capture_time: 1710000000,
          profile_min_mer: [33.1, 33.2, 33.3],
          capacity_delta: [0.1, 0.2, 0.3],
          fec_summary: {
            total_codewords: 1000,
            corrected: 10,
            uncorrectable: 1,
          },
        },
      ],
    },
  },
};

describe("AdvancedRxMerProfilePerformanceView", () => {
  it("lets users mute OFDM profile performance chart series", async () => {
    render(<AdvancedRxMerProfilePerformanceView response={responseFixture} />);

    expect(screen.getByRole("button", { name: "PNG" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "CSV" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Zoom" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset Zoom" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Selection Insights" })).toBeTruthy();
    expect(screen.getByText("Drag across the profile chart to select a frequency range for zoom.")).toBeTruthy();

    const avgMerButton = screen.getByRole("button", { name: /Avg MER/ });
    const shannonButton = screen.getByRole("button", { name: /Shannon Limit/ });
    const profileButton = screen.getByRole("button", { name: /Profile 1/ });

    expect(avgMerButton.classList.contains("active")).toBe(true);
    expect(shannonButton.classList.contains("active")).toBe(true);
    expect(profileButton.classList.contains("active")).toBe(true);

    fireEvent.click(avgMerButton);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Avg MER/ }).classList.contains("active")).toBe(false);
    });

    fireEvent.click(shannonButton);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Shannon Limit/ }).classList.contains("active")).toBe(false);
    });

    fireEvent.click(profileButton);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Profile 1/ }).classList.contains("active")).toBe(false);
    });
  });
});
