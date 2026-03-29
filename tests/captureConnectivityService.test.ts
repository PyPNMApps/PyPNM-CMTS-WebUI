import { describe, expect, it, vi } from "vitest";

vi.mock("../src/services/http", () => ({
  requestWithBaseUrl: vi.fn(),
}));

import * as httpModule from "../src/services/http";
import { checkCaptureInputsOnline } from "../src/services/captureConnectivityService";

describe("captureConnectivityService", () => {
  it("checks modem connectivity through embedded PW sysDescr endpoint", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({
      data: {
        status: 0,
      },
    } as never);

    const online = await checkCaptureInputsOnline("http://172.19.8.250:8080", {
      macAddress: "aa:bb:cc:dd:ee:ff",
      ipAddress: "172.19.8.28",
      community: "private",
    });

    expect(online).toBe(true);
    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://172.19.8.250:8080", {
      method: "POST",
      url: "/cm/system/sysDescr",
      data: {
        cable_modem: {
          mac_address: "aa:bb:cc:dd:ee:ff",
          ip_address: "172.19.8.28",
          snmp: {
            snmpV2C: {
              community: "private",
            },
          },
        },
      },
      timeout: 10_000,
    });
  });
});
