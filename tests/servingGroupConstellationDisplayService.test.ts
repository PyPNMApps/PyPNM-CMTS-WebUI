import { describe, expect, it, vi } from "vitest";

vi.mock("../src/services/http", () => ({
  requestWithBaseUrl: vi.fn(),
}));

import * as httpModule from "../src/services/http";
import {
  cancelServingGroupConstellationDisplayCapture,
  getServingGroupConstellationDisplayCaptureStatus,
  getServingGroupConstellationDisplayResults,
  startServingGroupConstellationDisplayCapture,
} from "../src/pcw/services/servingGroupConstellationDisplayService";

describe("servingGroupConstellationDisplayService", () => {
  it("calls startCapture with POST and payload", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { operation_id: "op-1" } } as never);

    const payload = {
      cmts: {
        serving_group: { id: [101] },
        cable_modem: {
          mac_address: ["00:11:22:33:44:55"],
          pnm_parameters: {
            tftp: { ipv4: "172.19.8.28", ipv6: "::1" },
            capture: { channel_ids: [0] },
          },
          snmp: {
            snmpV2C: { community: "private" },
          },
        },
      },
      execution: {
        max_workers: 16,
        retry_count: 3,
        retry_delay_seconds: 5,
        per_modem_timeout_seconds: 30,
        overall_timeout_seconds: 120,
      },
      capture_settings: {
        modulation_order_offset: 0,
        number_sample_symbol: 8192,
      },
    };

    await startServingGroupConstellationDisplayCapture("http://127.0.0.1:8080", payload);

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/ds/ofdm/constellationDisplay/startCapture",
      data: payload,
      timeout: 120000,
    });
  });

  it("calls status with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "completed" } } as never);

    await getServingGroupConstellationDisplayCaptureStatus("http://127.0.0.1:8080", "op-1");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/ds/ofdm/constellationDisplay/status",
      data: {
        pnm_capture_operation_id: "op-1",
      },
      timeout: 30000,
    });
  });

  it("calls cancel with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "cancelling" } } as never);

    await cancelServingGroupConstellationDisplayCapture("http://127.0.0.1:8080", "op-1");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/ds/ofdm/constellationDisplay/cancel",
      data: {
        pnm_capture_operation_id: "op-1",
      },
      timeout: 30000,
    });
  });

  it("calls results with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { results: {} } } as never);

    await getServingGroupConstellationDisplayResults("http://127.0.0.1:8080", "op-1");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/ds/ofdm/constellationDisplay/results",
      data: {
        pnm_capture_operation_id: "op-1",
      },
      timeout: 30000,
    });
  });
});
