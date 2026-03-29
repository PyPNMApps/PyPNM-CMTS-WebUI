import { describe, expect, it, vi } from "vitest";

vi.mock("../src/services/http", () => ({
  requestWithBaseUrl: vi.fn(),
}));

import * as httpModule from "../src/services/http";
import {
  cancelServingGroupHistogramCapture,
  getServingGroupHistogramCaptureStatus,
  getServingGroupHistogramResults,
  startServingGroupHistogramCapture,
} from "../src/pcw/services/servingGroupHistogramService";

describe("servingGroupHistogramService", () => {
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
            capture: { channel_ids: [] },
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
        sample_duration: 10,
      },
    };

    await startServingGroupHistogramCapture("http://127.0.0.1:8080", payload);

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/ds/histogram/startCapture",
      data: payload,
      timeout: 120000,
    });
  });

  it("calls status with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "completed" } } as never);

    await getServingGroupHistogramCaptureStatus("http://127.0.0.1:8080", "op-1");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/ds/histogram/status",
      data: {
        pnm_capture_operation_id: "op-1",
      },
      timeout: 30000,
    });
  });

  it("calls cancel with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "cancelling" } } as never);

    await cancelServingGroupHistogramCapture("http://127.0.0.1:8080", "op-1");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/ds/histogram/cancel",
      data: {
        pnm_capture_operation_id: "op-1",
      },
      timeout: 30000,
    });
  });

  it("calls results with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { results: {} } } as never);

    await getServingGroupHistogramResults("http://127.0.0.1:8080", "op-1");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/ds/histogram/results",
      data: {
        pnm_capture_operation_id: "op-1",
      },
      timeout: 30000,
    });
  });
});
