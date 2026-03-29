// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/app/ThemeProvider";
import { PRODUCT_PROFILE_PW, resolveProductProfileWithFallback } from "@/app/productProfile";
import { AppTopNav } from "@/components/layout/AppTopNav";
import {
  operationsMenuNavigationItems,
  spectrumAnalyzerNavigationItems,
} from "@/pw/features/operations/operationsNavigation";

vi.mock("@/components/layout/InstanceSelector", () => ({
  InstanceSelector: () => <div>Instance Selector</div>,
}));

describe("navigation structure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("renders the expected top-level nav links for the active profile", () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <AppTopNav />
        </MemoryRouter>
      </ThemeProvider>,
    );

    const nav = screen.getAllByRole("navigation")[0];
    const navLabels = Array.from(nav.children)
      .map((element) => {
        if (!(element instanceof HTMLElement)) {
          return null;
        }
        const interactive = within(element).queryByRole("link") ?? within(element).queryByRole("button");
        return interactive?.textContent?.trim() ?? element.textContent?.trim() ?? null;
      })
      .filter(Boolean);
    const profile = resolveProductProfileWithFallback();
    const expectedLabels = profile === PRODUCT_PROFILE_PW
      ? ["Single Capture", "Spectrum Analyzer", "Operations", "Advanced", "Files", "Health", "Settings", "About"]
      : ["Serving Group", "SingleCapture", "Spectrum Analyzer", "Health", "Settings", "About"];
    expect(navLabels).toEqual(expectedLabels);
  });

  it("keeps profile-specific top-level sections without cross-profile leakage", () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <AppTopNav />
        </MemoryRouter>
      </ThemeProvider>,
    );

    const nav = screen.getAllByRole("navigation")[0];
    const navLabels = Array.from(nav.children)
      .map((element) => {
        if (!(element instanceof HTMLElement)) {
          return null;
        }
        const interactive = within(element).queryByRole("link") ?? within(element).queryByRole("button");
        return interactive?.textContent?.trim() ?? element.textContent?.trim() ?? null;
      })
      .filter(Boolean);
    const profile = resolveProductProfileWithFallback();
    expect(navLabels).toContain("Spectrum Analyzer");
    expect(navLabels).toContain("Health");
    expect(navLabels).toContain("Settings");
    expect(navLabels).toContain("About");
    if (profile === PRODUCT_PROFILE_PW) {
      expect(navLabels).toContain("Single Capture");
      expect(navLabels).toContain("Operations");
      expect(navLabels).toContain("Advanced");
      expect(navLabels).toContain("Files");
      expect(navLabels).not.toContain("Serving Group");
      expect(navLabels).not.toContain("SingleCapture");
    } else {
      expect(navLabels).toContain("Serving Group");
      expect(navLabels).toContain("SingleCapture");
      expect(navLabels).not.toContain("Single Capture");
      expect(navLabels).not.toContain("Operations");
      expect(navLabels).not.toContain("Advanced");
      expect(navLabels).not.toContain("Files");
    }
  });

  it("keeps Spectrum Analyzer routes out of the Operations menu data set", () => {
    expect(spectrumAnalyzerNavigationItems).toHaveLength(4);
    expect(spectrumAnalyzerNavigationItems.map((item) => item.routePath)).toEqual([
      "/single-capture/spectrum-analyzer/friendly",
      "/single-capture/spectrum-analyzer/full-band",
      "/single-capture/spectrum-analyzer/ofdm",
      "/single-capture/spectrum-analyzer/scqam",
    ]);
    expect(
      operationsMenuNavigationItems.some((item) => item.routePath.includes("spectrum-analyzer")),
    ).toBe(false);
  });

});
