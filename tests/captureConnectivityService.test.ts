import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/http", () => ({
  requestWithBaseUrl: vi.fn(),
}));

import * as httpModule from "../src/services/http";
import { checkCaptureInputsOnline } from "../src/pw/services/captureConnectivityService";

describe("captureConnectivityService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses native PW sysDescr path in PW profile", async () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
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
      url: "/system/sysDescr",
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

  it("uses /cm sysDescr path in PCW profile", async () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-cmts-webui");
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

  it("accepts string success statuses from the backend", async () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({
      data: {
        status: "success",
        device: {
          mac_address: "AA:BB:CC:DD:EE:FF",
        },
      },
    } as never);

    const online = await checkCaptureInputsOnline("http://172.19.8.250:8080", {
      macAddress: "aa:bb:cc:dd:ee:ff",
      ipAddress: "172.19.8.28",
      community: "private",
    });

    expect(online).toBe(true);
  });

  it("marks the modem offline when the backend returns a different MAC", async () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({
      data: {
        status: 0,
        device: {
          mac_address: "11:22:33:44:55:66",
        },
      },
    } as never);

    const online = await checkCaptureInputsOnline("http://172.19.8.250:8080", {
      macAddress: "aa:bb:cc:dd:ee:ff",
      ipAddress: "172.19.8.28",
      community: "private",
    });

    expect(online).toBe(false);
  });
});
