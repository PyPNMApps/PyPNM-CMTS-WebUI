import type { PnmFileHexdumpResponse } from "@/types/api";

const STORAGE_KEY_PREFIX = "pypnm.fileHexdump.";

export interface StoredFileHexdumpRecord {
  transactionId: string;
  bytesPerLine: number;
  lines: string[];
  createdAt: string;
}

export function toFileHexdumpStorageKey(transactionId: string): string {
  return `${STORAGE_KEY_PREFIX}${transactionId}.${Date.now()}`;
}

export function storeFileHexdumpRecord(key: string, response: PnmFileHexdumpResponse, transactionId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const record: StoredFileHexdumpRecord = {
    transactionId,
    bytesPerLine: response.bytes_per_line,
    lines: response.lines,
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(key, JSON.stringify(record));
}

export function loadFileHexdumpRecord(key: string): StoredFileHexdumpRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredFileHexdumpRecord;
  } catch {
    return null;
  }
}

export function removeFileHexdumpRecord(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}
