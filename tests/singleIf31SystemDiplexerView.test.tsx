// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SingleIf31SystemDiplexerView } from "@/pw/features/operations/SingleIf31SystemDiplexerView";
import { singleIf31SystemDiplexerFixture } from "@/pw/features/operations/singleIf31SystemDiplexerFixture";

describe("SingleIf31SystemDiplexerView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the y-axis label as vertical text", () => {
    render(<SingleIf31SystemDiplexerView response={singleIf31SystemDiplexerFixture} />);

    const label = screen.getByText("Magnitude (dB)");
    expect(label.getAttribute("transform")).toContain("rotate(-90");
  });
});
