// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SingleModulationProfileCaptureView } from "@/pw/features/operations/SingleModulationProfileCaptureView";
import { singleModulationProfileFixture } from "@/pw/features/operations/singleModulationProfileFixture";

describe("SingleModulationProfileCaptureView", () => {
  it("renders per-channel mute chips and avoids repeating the channel id as chart title", () => {
    render(<SingleModulationProfileCaptureView response={singleModulationProfileFixture} />);

    const channel193Headings = screen.getAllByRole("heading", { name: "Channel 193" });
    expect(channel193Headings.length).toBe(1);

    const profileMuteChip = screen.getAllByRole("button", { name: /Profile 0 \(QAM-1024\)/i })[0];
    expect(profileMuteChip).toBeTruthy();

    fireEvent.click(profileMuteChip);

    const channel193Card = channel193Headings[0].closest("article");
    expect(channel193Card).toBeTruthy();
    expect(within(channel193Card as HTMLElement).getAllByRole("heading", { name: "Channel 193" })).toHaveLength(1);
  });
});
