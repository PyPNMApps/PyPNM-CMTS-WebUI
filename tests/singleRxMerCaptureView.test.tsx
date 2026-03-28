// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SingleRxMerCaptureView } from "@/features/operations/SingleRxMerCaptureView";
import { singleRxMerFixture } from "@/features/operations/singleRxMerFixture";

describe("SingleRxMerCaptureView", () => {
  it("renders selection zoom controls for combined and per-channel charts", () => {
    render(<SingleRxMerCaptureView response={singleRxMerFixture} />);

    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Selection Insights" }).length).toBeGreaterThan(0);
  });
});
