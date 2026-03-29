// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";

describe("LineAnalysisChart", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders shared mute controls for multi-series charts", () => {
    const { container } = render(
      <LineAnalysisChart
        title="Test Chart"
        subtitle="Multi-series"
        yLabel="dB"
        series={[
          {
            label: "Min",
            color: "#ef4444",
            points: [{ x: 100, y: 1 }, { x: 101, y: 2 }],
          },
          {
            label: "Avg",
            color: "#79a9ff",
            points: [{ x: 100, y: 2 }, { x: 101, y: 3 }],
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Min" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Avg" })).toBeTruthy();
    const initialPathCount = container.querySelectorAll("path").length;
    expect(initialPathCount).toBeGreaterThanOrEqual(2);

    fireEvent.click(screen.getByRole("button", { name: "Min" }));

    expect(container.querySelectorAll("path").length).toBeLessThan(initialPathCount);
  });

  it("keeps mute controls visible when all series are muted", () => {
    const { container } = render(
      <LineAnalysisChart
        title="Test Chart"
        subtitle="Multi-series"
        yLabel="dB"
        series={[
          {
            label: "Min",
            color: "#ef4444",
            points: [{ x: 100, y: 1 }, { x: 101, y: 2 }],
          },
          {
            label: "Avg",
            color: "#79a9ff",
            points: [{ x: 100, y: 2 }, { x: 101, y: 3 }],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Min" }));
    fireEvent.click(screen.getByRole("button", { name: "Avg" }));

    expect(screen.getByRole("button", { name: "Min" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Avg" })).toBeTruthy();
    expect(screen.queryByText("No chart data available.")).toBeNull();
    expect(container.querySelectorAll("path").length).toBe(0);
  });
});
