// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SingleUsOfdmaPreEqualizationView } from "@/pw/features/operations/SingleUsOfdmaPreEqualizationView";
import { singleUsOfdmaPreEqualizationFixture } from "@/pw/features/operations/singleUsOfdmaPreEqualizationFixture";

describe("SingleUsOfdmaPreEqualizationView", () => {
  it("renders the series summary as a horizontal table", () => {
    render(<SingleUsOfdmaPreEqualizationView response={singleUsOfdmaPreEqualizationFixture} />);

    const heading = screen.getByText("Series Summary");
    const panel = heading.closest("section") ?? heading.parentElement?.parentElement;
    expect(panel).toBeTruthy();

    const table = within(panel as HTMLElement).getByRole("table");
    expect(within(table).getByText("Series")).toBeTruthy();
    expect(within(table).getByText("Mean")).toBeTruthy();
    expect(within(table).getByText("Median")).toBeTruthy();
    expect(within(table).getByText("Echoes")).toBeTruthy();
    expect(within(table).getByText("Upstream Pre-Equalizer Coefficients")).toBeTruthy();
  });

  it("renders zoom-only controls for spectrum line charts", () => {
    render(<SingleUsOfdmaPreEqualizationView response={singleUsOfdmaPreEqualizationFixture} />);

    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Integrated Power" })).toBeNull();
  });
});
