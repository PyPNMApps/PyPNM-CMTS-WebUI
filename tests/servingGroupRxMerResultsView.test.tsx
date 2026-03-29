// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServingGroupRxMerResultsView } from "@/features/serving-group/components/ServingGroupRxMerResultsView";

describe("ServingGroupRxMerResultsView", () => {
  it("uses single-column layout and 1 CM labels for single-channel single-modem results", () => {
    const payload = {
      results: {
        serving_groups: [
          {
            service_group_id: 5,
            channels: [
              {
                channel_id: 193,
                cable_modems: [
                  {
                    mac_address: "aa:bb:cc:dd:ee:ff",
                    system_description: {
                      MODEL: "CPE-1",
                      SW_REV: "1.2.3",
                    },
                    rxmer_data: {
                      analysis: {
                        subcarrier_spacing: 50000,
                        carrier_values: {
                          frequency: [774000000, 774050000],
                          magnitude: [45.5, 46.2],
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

    const { container } = render(<ServingGroupRxMerResultsView payload={payload} />);
    expect(screen.getAllByText("1 CM").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".analysis-channels-grid-single").length).toBeGreaterThan(0);
  });
});
