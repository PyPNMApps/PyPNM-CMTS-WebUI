import { describe, expect, it } from "vitest";

import {
  isValidIpAddress,
  isValidIpv4Address,
  isValidIpv6Address,
  isValidMacAddress,
} from "../src/lib/forms/networkValidation";

describe("networkValidation", () => {
  it("accepts MAC addresses with mixed delimiters", () => {
    expect(isValidMacAddress("aa:bb:cc:dd:ee:ff")).toBe(true);
    expect(isValidMacAddress("aa-bb-cc-dd-ee-ff")).toBe(true);
    expect(isValidMacAddress("aa.bb.cc.dd.ee.ff")).toBe(true);
    expect(isValidMacAddress("aa bb cc dd ee ff")).toBe(true);
  });

  it("rejects invalid MAC addresses", () => {
    expect(isValidMacAddress("aa:bb:cc:dd:ee")).toBe(false);
    expect(isValidMacAddress("gg:bb:cc:dd:ee:ff")).toBe(false);
  });

  it("validates IPv4 correctly", () => {
    expect(isValidIpv4Address("192.168.100.10")).toBe(true);
    expect(isValidIpv4Address("256.168.100.10")).toBe(false);
  });

  it("validates IPv6 correctly", () => {
    expect(isValidIpv6Address("::1")).toBe(true);
    expect(isValidIpv6Address("2001:db8::1")).toBe(true);
    expect(isValidIpv6Address("2001:::1")).toBe(false);
  });

  it("accepts either IPv4 or IPv6 for generic IP validation", () => {
    expect(isValidIpAddress("10.0.0.1")).toBe(true);
    expect(isValidIpAddress("fe80::1")).toBe(true);
    expect(isValidIpAddress("not-an-ip")).toBe(false);
  });
});
