import { describe, expect, it } from "vitest";
import { parseChannelIds, validateAndNormalizeChannelIds } from "../src/lib/channelIds";

describe("validateAndNormalizeChannelIds", () => {
  it("treats 0 by itself as all channels (empty array)", () => {
    expect(validateAndNormalizeChannelIds("0")).toEqual({
      channelIds: [],
      error: null,
    });
  });

  it("accepts positive channel IDs", () => {
    expect(validateAndNormalizeChannelIds("1,2,3")).toEqual({
      channelIds: [1, 2, 3],
      error: null,
    });
  });

  it("rejects 0 combined with other IDs", () => {
    const result = validateAndNormalizeChannelIds("0,2");
    expect(result.channelIds).toEqual([]);
    expect(result.error).toContain("only valid by itself");
  });

  it("rejects non-integer input", () => {
    const result = validateAndNormalizeChannelIds("2,a");
    expect(result.channelIds).toEqual([]);
    expect(result.error).toContain("Invalid channel ID");
  });
});

describe("parseChannelIds", () => {
  it("treats blank as all channels", () => {
    expect(parseChannelIds("")).toEqual([]);
    expect(parseChannelIds("   ")).toEqual([]);
  });

  it("treats 0 as all channels", () => {
    expect(parseChannelIds("0")).toEqual([]);
    expect(parseChannelIds(" 0 ")).toEqual([]);
  });

  it("preserves positive channel IDs", () => {
    expect(parseChannelIds("193,194")).toEqual([193, 194]);
  });
});
