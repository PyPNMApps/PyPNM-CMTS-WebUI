// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SingleSpectrumFriendlyCaptureView } from "@/pw/features/spectrum-analyzer/SingleSpectrumFriendlyCaptureView";
import { SingleSpectrumOfdmCaptureView } from "@/pw/features/spectrum-analyzer/SingleSpectrumOfdmCaptureView";
import { SingleSpectrumScqamCaptureView } from "@/pw/features/spectrum-analyzer/SingleSpectrumScqamCaptureView";
import { singleSpectrumFriendlyCaptureFixture } from "@/pw/features/spectrum-analyzer/fixtures/singleSpectrumFriendlyCaptureFixture";
import { singleSpectrumFullBandCaptureFixture } from "@/pw/features/spectrum-analyzer/fixtures/singleSpectrumFullBandCaptureFixture";
import { singleSpectrumOfdmCaptureFixture } from "@/pw/features/spectrum-analyzer/fixtures/singleSpectrumOfdmCaptureFixture";
import { singleSpectrumScqamCaptureFixture } from "@/pw/features/spectrum-analyzer/fixtures/singleSpectrumScqamCaptureFixture";

describe("spectrum export actions", () => {
  it("renders PNG and CSV actions for friendly and full-band spectrum views", () => {
    const { rerender } = render(
      <SingleSpectrumFriendlyCaptureView response={singleSpectrumFriendlyCaptureFixture} exportVariant="friendly" />,
    );

    expect(screen.getByRole("button", { name: "PNG" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "CSV" })).toBeTruthy();

    rerender(
      <SingleSpectrumFriendlyCaptureView response={singleSpectrumFullBandCaptureFixture} exportVariant="full-band" />,
    );

    expect(screen.getByRole("button", { name: "PNG" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "CSV" })).toBeTruthy();
  });

  it("renders PNG and CSV actions for OFDM spectrum views", () => {
    render(<SingleSpectrumOfdmCaptureView response={singleSpectrumOfdmCaptureFixture} />);

    expect(screen.getAllByRole("button", { name: "PNG" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "CSV" }).length).toBeGreaterThan(0);
  });

  it("renders PNG and CSV actions for SCQAM spectrum views", () => {
    render(<SingleSpectrumScqamCaptureView response={singleSpectrumScqamCaptureFixture} />);

    expect(screen.getAllByRole("button", { name: "PNG" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "CSV" }).length).toBeGreaterThan(0);
  });
});
