// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InstanceConfigContext } from "@/app/InstanceConfigContext";
import type { InstanceConfigContextValue } from "@/app/InstanceConfigProvider";
import { EndpointExplorerPage } from "@/pages/EndpointExplorerPage";

vi.mock("@/services/captureConnectivityService", () => ({
  checkCaptureInputsOnline: vi.fn(),
}));

vi.mock("@/services/singleCaptureService", () => ({
  runSingleCaptureEndpoint: vi.fn(),
}));

function createContextValue(): InstanceConfigContextValue {
  return {
    config: {
      version: 1,
      defaults: {
        selectedInstance: "agent-1",
        pollIntervalMs: 15000,
        requestTimeoutMs: 4000,
        healthPath: "/health",
        logging: {
          level: "INFO",
        },
      },
      instances: [
        {
          id: "agent-1",
          label: "Agent 1",
          baseUrl: "http://127.0.0.1:8080",
          enabled: true,
          tags: [],
          capabilities: [],
          polling: {
            enabled: false,
            intervalMs: 0,
          },
          requestDefaults: {
            cableModemMacAddress: "",
            cableModemIpAddress: "",
            tftpIpv4: "",
            tftpIpv6: "",
            channelIds: "",
            snmpRwCommunity: "",
          },
        },
      ],
    },
    instances: [
      {
        id: "agent-1",
        label: "Agent 1",
        baseUrl: "http://127.0.0.1:8080",
        enabled: true,
        tags: [],
        capabilities: [],
        polling: {
          enabled: false,
          intervalMs: 0,
        },
        requestDefaults: {
          cableModemMacAddress: "",
          cableModemIpAddress: "",
          tftpIpv4: "",
          tftpIpv6: "",
          channelIds: "",
          snmpRwCommunity: "",
        },
      },
    ],
    selectedInstance: {
      id: "agent-1",
      label: "Agent 1",
      baseUrl: "http://127.0.0.1:8080",
      enabled: true,
      tags: [],
      capabilities: [],
      polling: {
        enabled: false,
        intervalMs: 0,
      },
      requestDefaults: {
        cableModemMacAddress: "",
        cableModemIpAddress: "",
        tftpIpv4: "",
        tftpIpv6: "",
        channelIds: "",
        snmpRwCommunity: "",
      },
    },
    isLoading: false,
    error: null,
    setSelectedInstanceId: vi.fn(),
  };
}

describe("EndpointExplorerPage", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("starts with N/A results instead of seeded example payloads", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <InstanceConfigContext.Provider value={createContextValue()}>
          <MemoryRouter initialEntries={["/single-capture/rxmer"]}>
            <Routes>
              <Route path="/single-capture/rxmer" element={<EndpointExplorerPage />} />
            </Routes>
          </MemoryRouter>
        </InstanceConfigContext.Provider>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Results" })).toBeTruthy();
    expect(screen.getByText("N/A")).toBeTruthy();
    expect(screen.getByText("No capture results yet. Run the operation to populate this panel.")).toBeTruthy();
    expect(screen.queryByText("Center Freq")).toBeNull();
  });

  it("prefills single-capture inputs from selected modem context", () => {
    window.localStorage.setItem("pcw:selected-modem-context", JSON.stringify({
      sgId: 1,
      macAddress: "AA:BB:CC:DD:EE:FF",
      ipAddress: "10.1.0.25",
      snmpCommunity: "private",
      channelIds: [193, 194],
      selectedAtEpochMs: 1774739979000,
    }));

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <InstanceConfigContext.Provider value={createContextValue()}>
          <MemoryRouter initialEntries={["/single-capture/rxmer"]}>
            <Routes>
              <Route path="/single-capture/rxmer" element={<EndpointExplorerPage />} />
            </Routes>
          </MemoryRouter>
        </InstanceConfigContext.Provider>
      </QueryClientProvider>,
    );

    expect((document.getElementById("macAddress") as HTMLInputElement | null)?.value).toBe("aa:bb:cc:dd:ee:ff");
    expect((document.getElementById("ipAddress") as HTMLInputElement | null)?.value).toBe("10.1.0.25");
    expect((document.getElementById("channelIds") as HTMLInputElement | null)?.value).toBe("");
    expect((document.getElementById("community") as HTMLInputElement | null)?.value).toBe("private");
  });
});
