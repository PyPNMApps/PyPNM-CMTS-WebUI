import { describe, expect, it, vi } from "vitest";

vi.mock("../src/services/http", () => ({
  requestWithBaseUrl: vi.fn(),
}));

import * as httpModule from "../src/services/http";
import {
  cancelServingGroupSpectrumFriendlyCapture,
  getServingGroupSpectrumFriendlyCaptureStatus,
  getServingGroupSpectrumFriendlyResults,
  startServingGroupSpectrumFriendlyCapture,
} from "../src/services/servingGroupSpectrumFriendlyService";

describe("servingGroupSpectrumFriendlyService", () => {
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
        inactivity_timeout: 60,
        first_segment_center_freq: 300000000,
        last_segment_center_freq: 900000000,
        resolution_bw: 30000,
        noise_bw: 150,
        window_function: 1,
        num_averages: 1,
        spectrum_retrieval_type: 1,
      },
    };

    await startServingGroupSpectrumFriendlyCapture("http://127.0.0.1:8080", payload);

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/spectrumAnalyzer/startCapture",
      data: payload,
      timeout: 120000,
    });
  });

  it("calls status with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "completed" } } as never);

    await getServingGroupSpectrumFriendlyCaptureStatus("http://127.0.0.1:8080", "op-1");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/spectrumAnalyzer/status",
      data: {
        pnm_capture_operation_id: "op-1",
      },
      timeout: 30000,
    });
  });

  it("calls cancel with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "cancelling" } } as never);

    await cancelServingGroupSpectrumFriendlyCapture("http://127.0.0.1:8080", "op-1");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/spectrumAnalyzer/cancel",
      data: {
        pnm_capture_operation_id: "op-1",
      },
      timeout: 30000,
    });
  });

  it("calls results with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { records: [] } } as never);

    await getServingGroupSpectrumFriendlyResults("http://127.0.0.1:8080", "op-1");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/pnm/sg/spectrumAnalyzer/results",
      data: {
        pnm_capture_operation_id: "op-1",
      },
      timeout: 30000,
    });
  });
});

