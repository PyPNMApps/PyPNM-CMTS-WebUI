import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getPnmFileDownloadUrl,
  getPnmFileFilenameDownloadUrl,
  getPnmFileMacArchiveDownloadUrl,
  getPnmFileOperationArchiveDownloadUrl,
  getPnmFileTransactionDownloadUrl,
} from "@/services/pnmFilesService";

describe("pnmFilesService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds a stable transaction download URL in PW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
    expect(getPnmFileDownloadUrl("http://127.0.0.1:8080/", "abc123")).toBe(
      "http://127.0.0.1:8080/docs/pnm/files/download/transactionID/abc123",
    );
  });

  it("builds a stable transaction download URL in PCW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-cmts-webui");
    expect(getPnmFileDownloadUrl("http://127.0.0.1:8080/", "abc123")).toBe(
      "http://127.0.0.1:8080/cm/docs/pnm/files/download/transactionID/abc123",
    );
  });

  it("builds alternate file-manager download URLs in PW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
    expect(getPnmFileTransactionDownloadUrl("http://127.0.0.1:8080/", "abc123")).toBe(
      "http://127.0.0.1:8080/docs/pnm/files/download/transactionID/abc123",
    );
    expect(getPnmFileFilenameDownloadUrl("http://127.0.0.1:8080/", "capture.bin.zst")).toBe(
      "http://127.0.0.1:8080/docs/pnm/files/download/filename/capture.bin.zst",
    );
    expect(getPnmFileMacArchiveDownloadUrl("http://127.0.0.1:8080/", "aa:bb:cc:dd:ee:ff")).toBe(
      "http://127.0.0.1:8080/docs/pnm/files/download/macAddress/aa%3Abb%3Acc%3Add%3Aee%3Aff",
    );
    expect(getPnmFileOperationArchiveDownloadUrl("http://127.0.0.1:8080/", "op-1")).toBe(
      "http://127.0.0.1:8080/docs/pnm/files/download/operationID/op-1",
    );
  });

  it("builds alternate file-manager download URLs in PCW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-cmts-webui");
    expect(getPnmFileTransactionDownloadUrl("http://127.0.0.1:8080/", "abc123")).toBe(
      "http://127.0.0.1:8080/cm/docs/pnm/files/download/transactionID/abc123",
    );
    expect(getPnmFileFilenameDownloadUrl("http://127.0.0.1:8080/", "capture.bin.zst")).toBe(
      "http://127.0.0.1:8080/cm/docs/pnm/files/download/filename/capture.bin.zst",
    );
    expect(getPnmFileMacArchiveDownloadUrl("http://127.0.0.1:8080/", "aa:bb:cc:dd:ee:ff")).toBe(
      "http://127.0.0.1:8080/cm/docs/pnm/files/download/macAddress/aa%3Abb%3Acc%3Add%3Aee%3Aff",
    );
    expect(getPnmFileOperationArchiveDownloadUrl("http://127.0.0.1:8080/", "op-1")).toBe(
      "http://127.0.0.1:8080/cm/docs/pnm/files/download/operationID/op-1",
    );
  });
});
