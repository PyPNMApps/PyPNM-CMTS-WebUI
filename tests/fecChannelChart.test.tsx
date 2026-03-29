// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FecChannelChart } from "@/features/operations/FecChannelChart";

const profiles = [
  {
    profile: 0,
    codewords: {
      timestamps: [1710000000, 1710000600],
      total_codewords: [100, 140],
      corrected: [20, 25],
      uncorrected: [3, 4],
    },
  },
];

describe("FecChannelChart", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses the bottom legend chips as real metric mute toggles", () => {
    render(<FecChannelChart title="FEC Summary" profiles={profiles} />);

    const totalButton = screen.getByRole("button", { name: "Total CW" });
    const correctedButton = screen.getByRole("button", { name: "Corrected CW" });
    const uncorrectedButton = screen.getByRole("button", { name: "Uncorrected CW" });

    expect(totalButton.getAttribute("aria-pressed")).toBe("true");
    expect(correctedButton.getAttribute("aria-pressed")).toBe("true");
    expect(uncorrectedButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(correctedButton);

    expect(correctedButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(totalButton);
    fireEvent.click(uncorrectedButton);

    expect(totalButton.getAttribute("aria-pressed")).toBe("false");
    expect(uncorrectedButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("enables zoom after drag selection and resets zoom", () => {
    render(<FecChannelChart title="FEC Summary" profiles={profiles} />);

    const [zoomButton] = screen.getAllByRole("button", { name: "Zoom" });
    const [resetZoomButton] = screen.getAllByRole("button", { name: "Reset Zoom" });
    const [overlayElement] = screen.getAllByTestId("fec-zoom-overlay");
    const overlay = overlayElement as unknown as SVGRectElement;

    expect(zoomButton.getAttribute("disabled")).not.toBeNull();
    expect(resetZoomButton.getAttribute("disabled")).not.toBeNull();

    Object.defineProperty(overlay.ownerSVGElement as SVGSVGElement, "getBoundingClientRect", {
      value: () => ({
        left: 0,
        top: 0,
        width: 980,
        height: 320,
        right: 980,
        bottom: 320,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    });

    fireEvent.mouseDown(overlay, { clientX: 120 });
    fireEvent.mouseMove(overlay, { clientX: 340 });
    fireEvent.mouseUp(overlay);

    expect(zoomButton.getAttribute("disabled")).toBeNull();
    fireEvent.click(zoomButton);
    expect(resetZoomButton.getAttribute("disabled")).toBeNull();
    fireEvent.click(resetZoomButton);
    expect(resetZoomButton.getAttribute("disabled")).not.toBeNull();
  });

  it("renders a per-profile data table", () => {
    render(<FecChannelChart title="FEC Summary" profiles={profiles} />);
    expect(screen.getByRole("columnheader", { name: "Profile" })).toBeDefined();
    expect(screen.getByText("Window Start (UTC)")).toBeDefined();
    expect(screen.getByText("Window End (UTC)")).toBeDefined();
  });
});
