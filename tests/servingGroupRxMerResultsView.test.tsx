// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServingGroupRxMerResultsView } from "@/pcw/features/serving-group/components/ServingGroupRxMerResultsView";

describe("ServingGroupRxMerResultsView", () => {
  it("renders row-preview table pattern and expands modem details from preview action", () => {
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

    render(<ServingGroupRxMerResultsView payload={payload} />);
    expect(screen.getAllByText("1 CM").length).toBeGreaterThan(0);
    expect(screen.getByRole("columnheader", { name: "Preview" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "MAC Address" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Avg MER (dB)" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Supported QAM (calc)" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Error-Free QAM" })).toBeTruthy();
    expect(screen.getByText("45.85")).toBeTruthy();
    expect(screen.getAllByText("QAM-4096").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Toggle RxMER details for aa:bb:cc:dd:ee:ff/i }));
    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);
  });
});
