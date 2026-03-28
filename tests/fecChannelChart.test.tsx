// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
  it("uses the bottom legend chips as real metric mute toggles", () => {
    render(<FecChannelChart title="FEC Summary" profiles={profiles} />);

    const totalButton = screen.getByRole("button", { name: "Solid: Total Codewords" });
    const correctedButton = screen.getByRole("button", { name: "Dashed: Corrected" });
    const uncorrectedButton = screen.getByRole("button", { name: "Dotted: Uncorrected" });

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
});
