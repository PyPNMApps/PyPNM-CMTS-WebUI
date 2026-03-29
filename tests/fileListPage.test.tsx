// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InstanceConfigContext } from "@/app/InstanceConfigContext";
import type { InstanceConfigContextValue } from "@/app/InstanceConfigProvider";
import { FileListPage } from "@/pcw/pages/FileListPage";

const pnmFilesServiceMocks = vi.hoisted(() => ({
  getPnmFileAnalysis: vi.fn(),
  getPnmFileFilenameDownloadUrl: vi.fn(() => "#"),
  getPnmFileHexdump: vi.fn(),
  getPnmFileMacAddresses: vi.fn(),
  getPnmFileMacArchiveDownloadUrl: vi.fn(() => "#"),
  getPnmFileOperationArchiveDownloadUrl: vi.fn(() => "#"),
  getPnmFileTransactionDownloadUrl: vi.fn(() => "#"),
  searchPnmFilesByMacAddress: vi.fn(),
  uploadPnmFile: vi.fn(),
}));

vi.mock("@/services/pnmFilesService", () => ({
  getPnmFileAnalysis: pnmFilesServiceMocks.getPnmFileAnalysis,
  getPnmFileFilenameDownloadUrl: pnmFilesServiceMocks.getPnmFileFilenameDownloadUrl,
  getPnmFileHexdump: pnmFilesServiceMocks.getPnmFileHexdump,
  getPnmFileMacAddresses: pnmFilesServiceMocks.getPnmFileMacAddresses,
  getPnmFileMacArchiveDownloadUrl: pnmFilesServiceMocks.getPnmFileMacArchiveDownloadUrl,
  getPnmFileOperationArchiveDownloadUrl: pnmFilesServiceMocks.getPnmFileOperationArchiveDownloadUrl,
  getPnmFileTransactionDownloadUrl: pnmFilesServiceMocks.getPnmFileTransactionDownloadUrl,
  searchPnmFilesByMacAddress: pnmFilesServiceMocks.searchPnmFilesByMacAddress,
  uploadPnmFile: pnmFilesServiceMocks.uploadPnmFile,
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

describe("FileListPage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    pnmFilesServiceMocks.getPnmFileAnalysis.mockReset();
    pnmFilesServiceMocks.getPnmFileHexdump.mockReset();
    pnmFilesServiceMocks.getPnmFileMacAddresses.mockReset();
    pnmFilesServiceMocks.searchPnmFilesByMacAddress.mockReset();
    pnmFilesServiceMocks.uploadPnmFile.mockReset();

    pnmFilesServiceMocks.getPnmFileMacAddresses.mockResolvedValue({
      mac_addresses: [
        {
          mac_address: "aa:bb:cc:dd:ee:ff",
          system_description: {
            VENDOR: "Vendor",
            MODEL: "Model",
          },
        },
      ],
    });

    pnmFilesServiceMocks.searchPnmFilesByMacAddress.mockResolvedValue({
      files: {
        "aa:bb:cc:dd:ee:ff": [
          {
            transaction_id: "tx-spectrum",
            filename: "spectrum.bin",
            pnm_test_type: "SPECTRUM_ANALYSIS",
            timestamp: 100,
            system_description: null,
          },
          {
            transaction_id: "tx-fec-new",
            filename: "fec-new.bin",
            pnm_test_type: "OFDM_FEC_SUMMARY",
            timestamp: 300,
            system_description: null,
          },
          {
            transaction_id: "tx-fec-old",
            filename: "fec-old.bin",
            pnm_test_type: "OFDM_FEC_SUMMARY",
            timestamp: 200,
            system_description: null,
          },
        ],
      },
    });
  });

  it("groups selected files into collapsed cards sorted by pnm test type", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <InstanceConfigContext.Provider value={createContextValue()}>
          <FileListPage />
        </InstanceConfigContext.Provider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(pnmFilesServiceMocks.searchPnmFilesByMacAddress).toHaveBeenCalledWith(
        "http://127.0.0.1:8080",
        "aa:bb:cc:dd:ee:ff",
      );
    });

    const groupCards = Array.from(container.querySelectorAll(".files-type-card"));
    expect(groupCards).toHaveLength(2);
    expect(groupCards[0]?.hasAttribute("open")).toBe(false);
    expect(groupCards[1]?.hasAttribute("open")).toBe(false);

    const summaries = Array.from(container.querySelectorAll(".files-type-summary .files-type-label")).map(
      (element) => element.textContent,
    );
    expect(summaries).toEqual(["OFDM_FEC_SUMMARY", "SPECTRUM_ANALYSIS"]);

    const firstGroupText = groupCards[0].textContent ?? "";
    expect(firstGroupText.indexOf("fec-new.bin")).toBeLessThan(firstGroupText.indexOf("fec-old.bin"));

    expect(screen.getByText("Files For Selected MAC")).toBeTruthy();
  });
});
