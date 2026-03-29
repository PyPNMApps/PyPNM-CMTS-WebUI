// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { readSelectedModemContext, saveSelectedModemContext } from "../src/pw/features/single-capture/lib/selectedModemContext";

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
});
