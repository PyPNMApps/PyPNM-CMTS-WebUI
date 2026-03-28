import { describe, expect, it } from "vitest";

import { isSupportedPnmFileType, toFileAnalysisStorageKey } from "@/lib/fileAnalysis";
import { PnmFileType, parsePnmFileType } from "@/types/pnmFileType";

describe("fileAnalysis", () => {
  it("recognizes supported backend file types", () => {
    expect(isSupportedPnmFileType(PnmFileType.RECEIVE_MODULATION_ERROR_RATIO)).toBe(true);
    expect(isSupportedPnmFileType(PnmFileType.OFDM_CHANNEL_ESTIMATE_COEFFICIENT)).toBe(true);
    expect(isSupportedPnmFileType("UNSUPPORTED_TYPE")).toBe(false);
  });

  it("creates namespaced storage keys", () => {
    expect(toFileAnalysisStorageKey("txn-1")).toMatch(/^pypnm\.fileAnalysis\.txn-1\./);
  });

  it("parses valid PNM file types from the shared enum", () => {
    expect(parsePnmFileType("RECEIVE_MODULATION_ERROR_RATIO")).toBe(PnmFileType.RECEIVE_MODULATION_ERROR_RATIO);
    expect(parsePnmFileType("SPECTRUM_ANALYSIS")).toBe(PnmFileType.SPECTRUM_ANALYSIS);
    expect(parsePnmFileType("NOT_REAL")).toBeNull();
  });
});
