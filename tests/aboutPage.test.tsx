// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AboutPage } from "@/pcw/pages/AboutPage";

vi.mock("@/services/repoMetadataService", () => ({
  REPO_URL: "https://github.com/PyPNMApps/PyPNM-WebUI",
  fetchCurrentLocalVersion: vi.fn().mockResolvedValue("0.2.15.9"),
  fetchLatestGitHubTag: vi.fn().mockResolvedValue("v0.2.12"),
}));

describe("AboutPage", () => {
  it("shows the current local four-part repo version", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AboutPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Current Local Version")).toBeTruthy();
    expect(await screen.findByText("0.2.15.9")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open User Docs" }).getAttribute("href")).toBe(
      "https://pypnmapps.github.io/PyPNM-CMTS-WebUI/",
    );
  });
});
