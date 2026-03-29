// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServingGroupHistogramResultsView } from "../src/pcw/features/serving-group/components/ServingGroupHistogramResultsView";

describe("ServingGroupHistogramResultsView", () => {
  it("renders a flat combined preview with foldable modem filter and row preview", () => {
    const payload = {
      results: {
        serving_groups: [
          {
            service_group_id: 1,
            cable_modems: [
              {
                mac_address: "aa:bb:cc:dd:ee:ff",
                system_description: {
                  VENDOR: "LANCity",
                  MODEL: "LCPET-3",
                  SW_REV: "1.0.0",
                },
                histogram_data: {
                  analysis: {
                    pnm_header: {
                      capture_time: 1772143470,
                    },
                    channel_id: -1,
                    hit_counts: [0, 1, 3, 5],
                  },
                },
              },
            ],
          },
        ],
      },
    };

    render(<ServingGroupHistogramResultsView payload={payload} />);
    expect(screen.getByText("Combined Histogram Preview")).toBeTruthy();
    expect(screen.getByText("Flat preview across serving groups")).toBeTruthy();

    fireEvent.click(screen.getByText("Cable Modem Filter"));
    expect(screen.getByRole("button", { name: "Select All" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Unselect All" })).toBeTruthy();
    expect(screen.getAllByText("MAC Address").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Model").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vendor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Version").length).toBeGreaterThan(0);
  });
});
