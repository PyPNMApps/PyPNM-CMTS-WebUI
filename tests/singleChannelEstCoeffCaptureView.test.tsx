// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SingleChannelEstCoeffCaptureView } from "@/features/operations/SingleChannelEstCoeffCaptureView";
import { singleChannelEstCoeffFixture } from "@/features/operations/singleChannelEstCoeffFixture";

describe("SingleChannelEstCoeffCaptureView", () => {
  it("renders zoom-only selection controls on line charts", () => {
    render(<SingleChannelEstCoeffCaptureView response={singleChannelEstCoeffFixture} />);

    expect(screen.getAllByRole("button", { name: "Zoom" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reset Zoom" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Integrated Power" })).toBeNull();
  });
});

