import { describe, expect, it } from "vitest";

import { formatIntegerLikeInput, parseIntegerLikeInput, sanitizeIntegerLikeInput } from "@/lib/forms/numericInput";

describe("numericInput", () => {
  it("sanitizes underscore and comma separated integer text", () => {
    expect(sanitizeIntegerLikeInput("300,000,000")).toBe("300000000");
    expect(sanitizeIntegerLikeInput("300_000_000")).toBe("300000000");
    expect(sanitizeIntegerLikeInput("300 000 000")).toBe("300000000");
  });

  it("parses integer-like UI text into backend numbers", () => {
    expect(parseIntegerLikeInput("300,000,000")).toBe(300000000);
    expect(parseIntegerLikeInput("300_000_000")).toBe(300000000);
    expect(parseIntegerLikeInput("30_000")).toBe(30000);
  });

  it("formats large integers for UI entry defaults", () => {
    expect(formatIntegerLikeInput(300000000)).toBe("300_000_000");
    expect(formatIntegerLikeInput(300000000, ",")).toBe("300,000,000");
  });
});
