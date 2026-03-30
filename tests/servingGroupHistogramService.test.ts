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
import {
  buildServingGroupCapturePayload,
  TEST_BASE_URL,
  TEST_OPERATION_ID,
  TEST_OPERATION_URLS,
  TEST_TIMEOUTS,
} from "./support/servingGroupTestConstants";
import { SERVING_GROUP_HISTOGRAM_DEFAULTS } from "../src/pcw/features/serving-group/lib/captureDefaults";

describe("servingGroupHistogramService", () => {
  it("calls startCapture with POST and payload", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { operation_id: TEST_OPERATION_ID } } as never);

    const payload = {
      ...buildServingGroupCapturePayload(),
      capture_settings: {
        sample_duration: SERVING_GROUP_HISTOGRAM_DEFAULTS.sampleDuration,
      },
    };

    await startServingGroupHistogramCapture(TEST_BASE_URL, payload);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.histogram.start,
      data: payload,
      timeout: TEST_TIMEOUTS.start,
    });
  });

  it("calls status with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "completed" } } as never);

    await getServingGroupHistogramCaptureStatus(TEST_BASE_URL, TEST_OPERATION_ID);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.histogram.status,
      data: {
        pnm_capture_operation_id: TEST_OPERATION_ID,
      },
      timeout: TEST_TIMEOUTS.status,
    });
  });

  it("calls cancel with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "cancelling" } } as never);

    await cancelServingGroupHistogramCapture(TEST_BASE_URL, TEST_OPERATION_ID);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.histogram.cancel,
      data: {
        pnm_capture_operation_id: TEST_OPERATION_ID,
      },
      timeout: TEST_TIMEOUTS.status,
    });
  });

  it("calls results with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { records: [] } } as never);

    await getServingGroupHistogramResults(TEST_BASE_URL, TEST_OPERATION_ID);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.histogram.results,
      data: {
        pnm_capture_operation_id: TEST_OPERATION_ID,
      },
      timeout: TEST_TIMEOUTS.status,
    });
  });
});
