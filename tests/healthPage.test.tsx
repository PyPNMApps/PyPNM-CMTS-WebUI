// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InstanceConfigContext } from "@/app/InstanceConfigContext";
import type { InstanceConfigContextValue } from "@/app/InstanceConfigProvider";
import { HealthPage } from "@/pcw/pages/HealthPage";

const healthServiceMocks = vi.hoisted(() => ({
  getHealth: vi.fn(),
  getHealthLogDownloadUrl: vi.fn((baseUrl: string) => `${baseUrl.replace(/\/$/, "")}/cm/pypnm/system/log/download`),
  reloadWebService: vi.fn(),
}));

vi.mock("@/services/healthService", () => ({
  classifyHealthError: vi.fn((error: Error) => ({ status: "error", message: error.message })),
  getHealth: healthServiceMocks.getHealth,
  getHealthLogDownloadUrl: healthServiceMocks.getHealthLogDownloadUrl,
  reloadWebService: healthServiceMocks.reloadWebService,
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
        {
          id: "agent-2",
          label: "Agent 2",
          baseUrl: "http://127.0.0.1:8081",
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
      {
        id: "agent-2",
        label: "Agent 2",
        baseUrl: "http://127.0.0.1:8081",
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

describe("HealthPage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    healthServiceMocks.getHealth.mockReset();
    healthServiceMocks.getHealthLogDownloadUrl.mockClear();
    healthServiceMocks.reloadWebService.mockReset();
    healthServiceMocks.getHealth.mockResolvedValue({
      status: "ok",
      service: {
        name: "pypnm-docsis",
        version: "1.0.0",
      },
      uptime: {
        starttime: 1_700_000_000,
        uptime: 120,
      },
      memory: {
        rss_bytes: 100,
        available_bytes: 200,
        total_bytes: 300,
      },
      data: {
        size_bytes: 1234,
        directories: {
          json: 1000,
          logs: 2000,
        },
      },
    });
    healthServiceMocks.reloadWebService.mockResolvedValue(undefined);
  });

  it("renders reload-all and per-agent reload buttons", async () => {
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
          <HealthPage />
        </InstanceConfigContext.Provider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(healthServiceMocks.getHealth).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByRole("button", { name: "Reload All Web Services" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Log" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Reload" })).toHaveLength(2);
  });

  it("opens .data directory details in a modal", async () => {
    const user = userEvent.setup();
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
          <HealthPage />
        </InstanceConfigContext.Provider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(healthServiceMocks.getHealth).toHaveBeenCalledTimes(2);
    });

    const directoryButtons = await screen.findAllByRole("button", { name: "View (2)" });
    await user.click(directoryButtons[0]);

    const dialog = screen.getByRole("dialog", { name: ".data Directories · Agent 1" });
    expect(dialog).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sort by size low to high" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Size ↓" })).toBeTruthy();
    expect(within(dialog).getAllByRole("row")[1].textContent).toContain("logs");
    expect(within(dialog).getAllByRole("row")[2].textContent).toContain("json");

    await user.click(screen.getByRole("button", { name: "Sort by size low to high" }));

    expect(screen.getByRole("button", { name: "Sort by size high to low" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Size ↑" })).toBeTruthy();
    expect(within(dialog).getAllByRole("row")[1].textContent).toContain("json");
    expect(within(dialog).getAllByRole("row")[2].textContent).toContain("logs");
  });

  it("reloads a single agent and all agents from the page actions", async () => {
    const user = userEvent.setup();
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
          <HealthPage />
        </InstanceConfigContext.Provider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(healthServiceMocks.getHealth).toHaveBeenCalledTimes(2);
    });

    await user.click(screen.getAllByRole("button", { name: "Reload" })[0]);

    await waitFor(() => {
      expect(healthServiceMocks.reloadWebService).toHaveBeenCalledWith("http://127.0.0.1:8080");
    });

    healthServiceMocks.reloadWebService.mockClear();

    await user.click(screen.getByRole("button", { name: "Reload All Web Services" }));

    await waitFor(() => {
      expect(healthServiceMocks.reloadWebService).toHaveBeenCalledTimes(2);
    });
    expect(healthServiceMocks.reloadWebService).toHaveBeenNthCalledWith(1, "http://127.0.0.1:8080");
    expect(healthServiceMocks.reloadWebService).toHaveBeenNthCalledWith(2, "http://127.0.0.1:8081");
  });
});
