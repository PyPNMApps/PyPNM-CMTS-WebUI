import { describe, expect, it } from "vitest";

import { toFileHexdumpStorageKey } from "@/lib/fileHexdump";

describe("fileHexdump", () => {
  it("creates namespaced storage keys", () => {
    expect(toFileHexdumpStorageKey("txn-1")).toMatch(/^pypnm\.fileHexdump\.txn-1\./);
  });
});
