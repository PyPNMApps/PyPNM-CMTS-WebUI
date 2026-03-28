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

vi.mock("@/features/operations/components/OperationsMenu", () => ({
  OperationsMenu: () => <button type="button">Operations</button>,
}));

describe("navigation structure", () => {
  it("renders Files first and Settings just before About", () => {
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
    expect(navLabels[0]).toBe("Files");
    expect(navLabels.indexOf("Settings")).toBeGreaterThan(-1);
    expect(navLabels.indexOf("About")).toBeGreaterThan(-1);
    expect(navLabels.indexOf("Settings")).toBe(navLabels.indexOf("About") - 1);
  });

  it("renders Operations before Spectrum Analyzer before Single Capture", () => {
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
    expect(navLabels.indexOf("Operations")).toBeLessThan(navLabels.indexOf("Spectrum Analyzer"));
    expect(navLabels.indexOf("Spectrum Analyzer")).toBeLessThan(navLabels.indexOf("Single Capture"));
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
