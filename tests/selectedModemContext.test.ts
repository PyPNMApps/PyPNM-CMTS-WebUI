// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  readSelectedModemContext,
  readSelectedModemIpByMac,
  saveSelectedModemContext,
  updateSelectedModemIpCache,
} from "../src/pw/features/single-capture/lib/selectedModemContext";

describe("selectedModemContext", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("round-trips selected modem context through localStorage", () => {
    saveSelectedModemContext({
      sgId: 1,
      macAddress: "AA:BB:CC:DD:EE:FF",
      ipAddress: "10.1.0.10",
      snmpCommunity: "private",
      channelIds: [193, 194],
      selectedAtEpochMs: 1774739979000,
    });

    const result = readSelectedModemContext();
    expect(result).not.toBeNull();
    expect(result?.macAddress).toBe("aa:bb:cc:dd:ee:ff");
    expect(result?.channelIds).toEqual([193, 194]);
  });

  it("stores and reads selected modem ip cache entries by mac", () => {
    updateSelectedModemIpCache([
      { macAddress: "AA:BB:CC:DD:EE:FF", ipAddress: "10.1.0.10" },
      { macAddress: "11:22:33:44:55:66", ipAddress: "10.1.0.11" },
    ]);

    expect(readSelectedModemIpByMac("aa:bb:cc:dd:ee:ff")).toBe("10.1.0.10");
    expect(readSelectedModemIpByMac("11:22:33:44:55:66")).toBe("10.1.0.11");
    expect(readSelectedModemIpByMac("00:00:00:00:00:00")).toBeNull();
  });

  it("resolves n/a selected modem IP from cached MAC mapping", () => {
    updateSelectedModemIpCache([
      { macAddress: "AA:BB:CC:DD:EE:FF", ipAddress: "10.9.9.9" },
    ]);

    saveSelectedModemContext({
      sgId: 1,
      macAddress: "AA:BB:CC:DD:EE:FF",
      ipAddress: "n/a",
      snmpCommunity: "private",
      channelIds: [193],
      selectedAtEpochMs: 1774739979000,
    });

    const result = readSelectedModemContext();
    expect(result?.ipAddress).toBe("10.9.9.9");
  });
});
