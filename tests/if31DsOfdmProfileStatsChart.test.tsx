// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { If31DsOfdmProfileStatsChart } from "@/features/operations/If31DsOfdmProfileStatsChart";

const values = [
  {
    label: "0",
    total: 100,
    corrected: 20,
    uncorrectable: 5,
    inOctets: 300,
    unicastOctets: 200,
    multicastOctets: 100,
  },
  {
    label: "1",
    total: 200,
    corrected: 30,
    uncorrectable: 4,
    inOctets: 400,
    unicastOctets: 250,
    multicastOctets: 150,
  },
];

describe("If31DsOfdmProfileStatsChart", () => {
  it("uses legend chips as real series mute toggles", () => {
    render(
      <If31DsOfdmProfileStatsChart
        title="Total / Corrected / Uncorrectable Codewords"
        subtitle="Per-profile codeword counters"
        values={values}
        mode="codewords"
      />,
    );

    const totalButton = screen.getByRole("button", { name: "Total" });
    const correctedButton = screen.getByRole("button", { name: "Corrected" });
    const uncorrectableButton = screen.getByRole("button", { name: "Uncorrectable" });

    expect(totalButton.getAttribute("aria-pressed")).toBe("true");
    expect(correctedButton.getAttribute("aria-pressed")).toBe("true");
    expect(uncorrectableButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(correctedButton);

    expect(correctedButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(totalButton);
    fireEvent.click(uncorrectableButton);

    expect(uncorrectableButton.getAttribute("aria-pressed")).toBe("true");
    expect(totalButton.getAttribute("aria-pressed")).toBe("false");
  });
});
