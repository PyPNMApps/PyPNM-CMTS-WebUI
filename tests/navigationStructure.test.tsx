// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  operationsMenuNavigationItems,
  spectrumAnalyzerNavigationItems,
} from "@/pw/features/operations/operationsNavigation";

vi.mock("@/components/layout/InstanceSelector", () => ({
  InstanceSelector: () => <div>Instance Selector</div>,
}));

interface RenderAppTopNavOptions {
  forcePwProfile?: boolean;
}

async function renderAppTopNav(options?: RenderAppTopNavOptions) {
  vi.resetModules();
  vi.doUnmock("@/app/productProfile");

  const [{ ThemeProvider }, { AppTopNav }, productProfile] = await Promise.all([
    import("@/app/ThemeProvider"),
    import("@/components/layout/AppTopNav"),
    import("@/app/productProfile"),
  ]);

  render(
    <ThemeProvider>
      <MemoryRouter>
        <AppTopNav profileOverride={options?.forcePwProfile === true ? "pypnm-webui" : undefined} />
      </MemoryRouter>
    </ThemeProvider>,
  );

  return { productProfile };
}

describe("navigation structure", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.doUnmock("@/app/productProfile");
    vi.resetModules();
  });

  it("renders the expected top-level nav links for the active profile", async () => {
    const { productProfile } = await renderAppTopNav();

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
    const profile = productProfile.resolveProductProfileWithFallback();
    const expectedLabels = profile === productProfile.PRODUCT_PROFILE_PW
      ? ["Single Capture", "Spectrum Analyzer", "Operations", "Advanced", "Files", "Health", "Settings", "About"]
      : ["Serving Group", "SingleCapture", "Spectrum Analyzer", "Health", "Settings", "About"];
    expect(navLabels).toEqual(expectedLabels);
  });

  it("keeps profile-specific top-level sections without cross-profile leakage", async () => {
    const { productProfile } = await renderAppTopNav();

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
    const profile = productProfile.resolveProductProfileWithFallback();
    expect(navLabels).toContain("Spectrum Analyzer");
    expect(navLabels).toContain("Health");
    expect(navLabels).toContain("Settings");
    expect(navLabels).toContain("About");
    if (profile === productProfile.PRODUCT_PROFILE_PW) {
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

  it("renders the operations dropdown trigger for PW profile", async () => {
    await renderAppTopNav({ forcePwProfile: true });

    const nav = screen.getAllByRole("navigation")[0];
    expect(within(nav).getAllByRole("button", { name: "Operations" })).toHaveLength(1);
  });

});
