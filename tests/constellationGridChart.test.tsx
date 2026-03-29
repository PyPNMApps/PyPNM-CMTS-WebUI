// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConstellationGridChart } from "@/features/operations/ConstellationGridChart";
import { singleConstellationDisplayFixture } from "@/features/operations/singleConstellationDisplayFixture";

describe("ConstellationGridChart", () => {
  it("renders the constellation header labels and values", () => {
    const channels = singleConstellationDisplayFixture.data?.analysis ?? [];
    render(<ConstellationGridChart channels={channels} />);

    const qamLabels = screen.getAllByText("QAM");
    const qamValues = screen.getAllByText("4096");
    const channelLabels = screen.getAllByText("Channel");
    const sampleSymbolsLabels = screen.getAllByText("Sample Symbols");

    expect(qamLabels.length).toBeGreaterThan(0);
    expect(qamValues.length).toBeGreaterThan(0);
    expect(channelLabels.length).toBeGreaterThan(0);
    expect(sampleSymbolsLabels.length).toBeGreaterThan(0);

    expect(qamLabels[0]?.className).toContain("constellation-header-label");
    expect(qamValues[0]?.className).toContain("constellation-header-value");
    expect(channelLabels[0]?.className).toContain("constellation-header-label");
    expect(sampleSymbolsLabels[0]?.className).toContain("constellation-header-label");
  });
});
