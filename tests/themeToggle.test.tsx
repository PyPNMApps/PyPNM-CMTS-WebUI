// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/app/ThemeProvider";
import { AppTopNav } from "@/components/layout/AppTopNav";

vi.mock("@/components/layout/InstanceSelector", () => ({
  InstanceSelector: () => <div>Instance Selector</div>,
}));

vi.mock("@/pw/features/operations/components/OperationsMenu", () => ({
  OperationsMenu: () => <button type="button">Operations</button>,
}));

describe("theme toggle", () => {
  it("toggles between dark and light mode from the top nav", () => {
    window.localStorage.clear();

    render(
      <ThemeProvider>
        <MemoryRouter>
          <AppTopNav />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe("dark");
    const toggle = screen.getByRole("button", { name: /Switch to light mode/i });
    expect(toggle.querySelector("svg")).toBeTruthy();

    fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("pypnm-webui:theme")).toBe("light");
    expect(screen.getByRole("button", { name: /Switch to dark mode/i }).querySelector("svg")).toBeTruthy();
  });
});
