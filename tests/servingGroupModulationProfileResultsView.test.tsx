// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServingGroupModulationProfileResultsView } from "../src/features/serving-group/components/ServingGroupModulationProfileResultsView";

describe("ServingGroupModulationProfileResultsView", () => {
  it("renders SG combined graph filter controls and expands a zoomable chart row", () => {
    const payload = {
      results: {
        serving_groups: [
          {
            service_group_id: 1,
            channels: [
              {
                channel_id: 33,
                cable_modems: [
                  {
                    mac_address: "aa:bb:cc:dd:ee:ff",
                    system_description: {
                      VENDOR: "LANCity",
                      MODEL: "LCPET-3",
                      SW_REV: "1.0.0",
                    },
                    modulation_profile_data: {
                      analysis: {
                        pnm_header: {
                          capture_time: 1774739979,
                        },
                        profiles: [
                          {
                            profile_id: 0,
                            carrier_values: {
                              frequency: [774000000, 774050000],
                              modulation: ["qam_1024"],
                              shannon_min_mer: [38.2, 38.4],
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    render(<ServingGroupModulationProfileResultsView payload={payload} />);
    expect(screen.getByText("Service Group 1 Combined by Frequency")).toBeTruthy();
    fireEvent.click(screen.getByText("Cable Modem Filter"));
    expect(screen.getByRole("button", { name: "Select All" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Unselect All" })).toBeTruthy();
    expect(screen.getAllByText("Vendor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Version").length).toBeGreaterThan(0);

    const toggleButton = screen.getByRole("button", {
      name: "Toggle modulation profile details for aa:bb:cc:dd:ee:ff",
    });
    fireEvent.click(toggleButton);

    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);
  });
});
