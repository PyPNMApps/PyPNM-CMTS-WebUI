// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SingleIf31DsOfdmProfileStatsView } from "@/pw/features/operations/SingleIf31DsOfdmProfileStatsView";
import { singleIf31DsOfdmProfileStatsFixture } from "@/pw/features/operations/singleIf31DsOfdmProfileStatsFixture";

describe("SingleIf31DsOfdmProfileStatsView", () => {
  it("does not use reserved profile ids for the dominant profile summary", () => {
    render(<SingleIf31DsOfdmProfileStatsView response={singleIf31DsOfdmProfileStatsFixture} />);

    const dominantProfileChip = screen.getAllByText("Dominant Profile")[0].closest(".analysis-chip");
    expect(dominantProfileChip).toBeTruthy();
    expect(dominantProfileChip?.textContent).toContain("Dominant Profile");
    expect(dominantProfileChip?.textContent).toContain("0");
    expect(dominantProfileChip?.textContent).not.toContain("255");
    expect(dominantProfileChip?.textContent).not.toContain("NCP");
  });
});
