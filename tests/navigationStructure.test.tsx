// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/app/ThemeProvider";
import { AppTopNav } from "@/components/layout/AppTopNav";
import {
  operationsMenuNavigationItems,
  spectrumAnalyzerNavigationItems,
} from "@/features/operations/operationsNavigation";

vi.mock("@/components/layout/InstanceSelector", () => ({
  InstanceSelector: () => <div>Instance Selector</div>,
}));

describe("navigation structure", () => {
  it("renders Serving Group, Health, Settings, and About as top-level nav links", () => {
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
    expect(navLabels).toEqual(["Serving Group", "Health", "Settings", "About"]);
  });

  it("removes legacy top-level sections while keeping serving-group shell", () => {
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
    expect(navLabels).toContain("Serving Group");
    expect(navLabels).toContain("Health");
    expect(navLabels).not.toContain("Advanced");
    expect(navLabels).not.toContain("Operations");
    expect(navLabels).not.toContain("Files");
    expect(navLabels).not.toContain("Spectrum Analyzer");
    expect(navLabels).not.toContain("Single Capture");
  });

  it("keeps Spectrum Analyzer routes out of the Operations menu data set", () => {
    expect(spectrumAnalyzerNavigationItems).toHaveLength(4);
    expect(spectrumAnalyzerNavigationItems.map((item) => item.routePath)).toEqual([
      "/spectrum-analyzer/friendly",
      "/spectrum-analyzer/full-band",
      "/spectrum-analyzer/ofdm",
      "/spectrum-analyzer/scqam",
    ]);
    expect(
      operationsMenuNavigationItems.some((item) => item.routePath.startsWith("/spectrum-analyzer")),
    ).toBe(false);
  });
});
