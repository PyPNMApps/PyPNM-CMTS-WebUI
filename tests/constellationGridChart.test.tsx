// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConstellationGridChart } from "@/features/operations/ConstellationGridChart";
import { singleConstellationDisplayFixture } from "@/features/operations/singleConstellationDisplayFixture";

describe("ConstellationGridChart", () => {
  it("renders a dedicated modulation label hook in the tile header", () => {
    const channels = singleConstellationDisplayFixture.data?.analysis ?? [];
    render(<ConstellationGridChart channels={channels} />);

    const modulationLabel = screen.getByText("QAM 4096");
    expect(modulationLabel.className).toContain("constellation-modulation-label");
  });
});
