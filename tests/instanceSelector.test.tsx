// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/useInstanceConfig", () => ({
  useInstanceConfig: () => ({
    config: null,
    instances: [
      {
        id: "local-pypnm-agent",
        label: "Local PyPNM Agent",
        baseUrl: "http://127.0.0.1:8080",
      },
    ],
    selectedInstance: {
      id: "local-pypnm-agent",
      label: "Local PyPNM Agent",
      baseUrl: "http://127.0.0.1:8080",
    },
    isLoading: false,
    error: null,
    setSelectedInstanceId: vi.fn(),
  }),
}));

vi.mock("@/app/productProfile", async () => {
  const actual = await vi.importActual<typeof import("@/app/productProfile")>("@/app/productProfile");

  return {
    ...actual,
    resolveProductProfileWithFallback: () => actual.PRODUCT_PROFILE_PW,
  };
});

import { InstanceSelector } from "@/components/layout/InstanceSelector";

describe("InstanceSelector", () => {
  it("shows the PyPNM agent label for the PW profile", () => {
    render(<InstanceSelector />);

    expect(screen.getByLabelText("PyPNM Agent")).toBeTruthy();
    expect(screen.queryByText("PyPNM-CMTS Agent")).toBeNull();
  });
});
