// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { ServingGroupRxMerResultsView } from "@/pcw/features/serving-group/components/ServingGroupRxMerResultsView";

describe("ServingGroupRxMerResultsView", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

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
                    ip_address: "10.88.1.55",
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

    render(
      <MemoryRouter>
        <ServingGroupRxMerResultsView payload={payload} />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("1 CM").length).toBeGreaterThan(0);
    expect(screen.getByRole("columnheader", { name: "Preview" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "MAC Address" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Avg MER (dB)" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Supported QAM (calc)" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Error-Free QAM" })).toBeTruthy();
    expect(screen.getByText("45.85")).toBeTruthy();
    expect(screen.getAllByText("QAM-4096").length).toBeGreaterThan(0);
    const macLink = screen.getByRole("link", { name: "aa:bb:cc:dd:ee:ff" });
    expect(macLink.getAttribute("href")).toBe("/single-capture/rxmer");
    fireEvent.click(macLink);
    expect(window.localStorage.getItem("pcw:selected-modem-context")).toContain("aa:bb:cc:dd:ee:ff");
    expect(window.localStorage.getItem("pcw:selected-modem-context")).toContain("10.88.1.55");

    fireEvent.click(screen.getByRole("button", { name: /Toggle RxMER details for aa:bb:cc:dd:ee:ff/i }));
    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);
  });

  it("falls back to cached modem ip when rxmer payload ip is unavailable", () => {
    window.localStorage.setItem("pcw:selected-modem-ip-cache", JSON.stringify({
      "aa:bb:cc:dd:ee:ff": "10.99.1.25",
    }));

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

    const view = render(
      <MemoryRouter>
        <ServingGroupRxMerResultsView payload={payload} />
      </MemoryRouter>,
    );

    const macLink = within(view.container).getByRole("link", { name: "aa:bb:cc:dd:ee:ff" });
    fireEvent.click(macLink);
    expect(window.localStorage.getItem("pcw:selected-modem-context")).toContain("10.99.1.25");
  });
});
