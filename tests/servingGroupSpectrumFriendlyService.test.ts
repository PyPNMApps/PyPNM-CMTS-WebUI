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
} from "../src/pcw/services/servingGroupSpectrumFriendlyService";
import {
  buildServingGroupCapturePayload,
  TEST_BASE_URL,
  TEST_OPERATION_ID,
  TEST_OPERATION_URLS,
  TEST_TIMEOUTS,
} from "./support/servingGroupTestConstants";
import {
  SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS,
} from "../src/pcw/features/serving-group/lib/captureDefaults";
import {
  DEFAULT_SPECTRUM_ANALYZER_RETRIEVAL_TYPE,
  DEFAULT_SPECTRUM_ANALYZER_WINDOW_FUNCTION,
} from "../src/lib/spectrumAnalyzerEnumLookup";

describe("servingGroupSpectrumFriendlyService", () => {
  it("calls startCapture with POST and payload", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { operation_id: TEST_OPERATION_ID } } as never);

    const payload = {
      ...buildServingGroupCapturePayload(),
      capture_settings: {
        inactivity_timeout: SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.inactivityTimeout,
        first_segment_center_freq: SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.firstSegmentCenterFreq,
        last_segment_center_freq: SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.lastSegmentCenterFreq,
        resolution_bw: SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.resolutionBw,
        noise_bw: SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.noiseBw,
        window_function: DEFAULT_SPECTRUM_ANALYZER_WINDOW_FUNCTION,
        num_averages: SERVING_GROUP_SPECTRUM_FRIENDLY_DEFAULTS.numAverages,
        spectrum_retrieval_type: DEFAULT_SPECTRUM_ANALYZER_RETRIEVAL_TYPE,
      },
    };

    await startServingGroupSpectrumFriendlyCapture(TEST_BASE_URL, payload);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.spectrumAnalyzer.start,
      data: payload,
      timeout: TEST_TIMEOUTS.start,
    });
  });

  it("calls status with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "completed" } } as never);

    await getServingGroupSpectrumFriendlyCaptureStatus(TEST_BASE_URL, TEST_OPERATION_ID);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.spectrumAnalyzer.status,
      data: {
        pnm_capture_operation_id: TEST_OPERATION_ID,
      },
      timeout: TEST_TIMEOUTS.status,
    });
  });

  it("calls cancel with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "cancelling" } } as never);

    await cancelServingGroupSpectrumFriendlyCapture(TEST_BASE_URL, TEST_OPERATION_ID);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.spectrumAnalyzer.cancel,
      data: {
        pnm_capture_operation_id: TEST_OPERATION_ID,
      },
      timeout: TEST_TIMEOUTS.status,
    });
  });

  it("calls results with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { records: [] } } as never);

    await getServingGroupSpectrumFriendlyResults(TEST_BASE_URL, TEST_OPERATION_ID);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.spectrumAnalyzer.results,
      data: {
        pnm_capture_operation_id: TEST_OPERATION_ID,
      },
      timeout: TEST_TIMEOUTS.status,
    });
  });
});
