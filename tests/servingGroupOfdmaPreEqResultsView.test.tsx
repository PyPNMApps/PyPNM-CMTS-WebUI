// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ServingGroupOfdmaPreEqResultsView } from "../src/pcw/features/serving-group/components/ServingGroupOfdmaPreEqResultsView";

describe("ServingGroupOfdmaPreEqResultsView", () => {
  it("renders per-CM previews and expandable coefficient/group-delay details", () => {
    const payload = {
      results: {
        serving_groups: [
          {
            service_group_id: 1,
            channels: [
              {
                channel_id: 7,
                cable_modems: [
                  {
                    mac_address: "aa:bb:cc:dd:ee:ff",
                    ip_address: "10.1.0.10",
                    system_description: {
                      VENDOR: "LANCity",
                      MODEL: "LCPET-3",
                      SW_REV: "1.0.0",
                    },
                    pre_equalization_data: {
                      analysis: {
                        pnm_header: {
                          capture_time: 1772143470,
                        },
                        channel_id: 7,
                        subcarrier_spacing: 25000,
                        carrier_values: {
                          frequency: [39900000, 39925000, 39950000],
                          channel_estimate_magnitude_db: [-1.5, -1.4, -1.3],
                          group_delay: {
                            magnitude: [0.1, 0.2, 0.3],
                          },
                        },
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

    render(
      <MemoryRouter>
        <ServingGroupOfdmaPreEqResultsView payload={payload} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Service Group 1")).toBeTruthy();
    expect(screen.getByText("Service Group 1 · Channel 7 · Combined Coefficient Magnitude")).toBeTruthy();
    expect(screen.getByRole("link", { name: "aa:bb:cc:dd:ee:ff" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Toggle OFDMA PreEq details for aa:bb:cc:dd:ee:ff" }));

    expect(screen.getByText("Coefficient Magnitude (MAC aa:bb:cc:dd:ee:ff)")).toBeTruthy();
    expect(screen.getByText("Group Delay (MAC aa:bb:cc:dd:ee:ff)")).toBeTruthy();
  });
});
