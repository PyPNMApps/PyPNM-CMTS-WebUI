// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdvancedOfdmaPreEqGroupDelayView } from "@/pw/features/advanced/AdvancedOfdmaPreEqGroupDelayView";
import { AdvancedOfdmaPreEqMinAvgMaxView } from "@/pw/features/advanced/AdvancedOfdmaPreEqMinAvgMaxView";
import type { AdvancedMultiUsOfdmaPreEqAnalysisResponse } from "@/types/api";

describe("Advanced OFDMA PreEq analysis views", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders zoom controls for min-avg-max analysis", () => {
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
    } as unknown as AdvancedMultiUsOfdmaPreEqAnalysisResponse;

    render(<AdvancedOfdmaPreEqMinAvgMaxView response={response} />);

    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);
  });

  it("renders zoom controls for group-delay analysis", () => {
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
            group_delay_us: [0.01, 0.02],
          },
        ],
      },
    } as unknown as AdvancedMultiUsOfdmaPreEqAnalysisResponse;

    render(<AdvancedOfdmaPreEqGroupDelayView response={response} />);

    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);
  });
});
