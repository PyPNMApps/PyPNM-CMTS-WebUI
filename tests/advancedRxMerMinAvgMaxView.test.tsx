// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvancedRxMerMinAvgMaxView } from "@/features/advanced/AdvancedRxMerMinAvgMaxView";
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
      min: [34.1, 34.2, 34.3],
      avg: [36.1, 36.2, 36.3],
      max: [38.1, 38.2, 38.3],
    },
  },
};

describe("AdvancedRxMerMinAvgMaxView", () => {
  it("lets users mute min avg and max chart series", async () => {
    render(<AdvancedRxMerMinAvgMaxView response={responseFixture} />);

    expect(screen.getAllByRole("button", { name: "PNG" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "CSV" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);

    const minButton = screen.getByRole("button", { name: /Min/ });
    const avgButton = screen.getByRole("button", { name: /Avg/ });
    const maxButton = screen.getByRole("button", { name: /Max/ });

    expect(minButton.classList.contains("active")).toBe(true);
    expect(avgButton.classList.contains("active")).toBe(true);
    expect(maxButton.classList.contains("active")).toBe(true);

    fireEvent.click(minButton);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Min/ }).classList.contains("active")).toBe(false);
      expect(screen.getByRole("button", { name: /Avg/ }).classList.contains("active")).toBe(true);
      expect(screen.getByRole("button", { name: /Max/ }).classList.contains("active")).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: /Avg/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Avg/ }).classList.contains("active")).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: /Max/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Max/ }).classList.contains("active")).toBe(false);
    });
  });
});
