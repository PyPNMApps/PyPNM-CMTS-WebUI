// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/routes/AppRoutes";

describe("AppRoutes profile guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows a configuration error when VITE_PRODUCT_PROFILE is invalid", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "invalid-profile");

    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText("Invalid Runtime Profile")).toBeTruthy();
    expect(screen.getByText(/Set VITE_PRODUCT_PROFILE to pypnm-webui or pypnm-cmts-webui/i)).toBeTruthy();
  });
});
