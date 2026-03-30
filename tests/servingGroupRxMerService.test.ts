import { describe, expect, it, vi } from "vitest";

vi.mock("../src/services/http", () => ({
  requestWithBaseUrl: vi.fn(),
}));

import * as httpModule from "../src/services/http";
import {
  cancelServingGroupRxMerCapture,
  getServingGroupRxMerCaptureStatus,
  getServingGroupRxMerResults,
  startServingGroupRxMerCapture,
} from "../src/pcw/services/servingGroupRxMerService";
import {
  buildServingGroupCapturePayload,
  TEST_BASE_URL,
  TEST_OPERATION_ID,
  TEST_OPERATION_URLS,
  TEST_TIMEOUTS,
} from "./support/servingGroupTestConstants";

describe("servingGroupRxMerService", () => {
  it("calls startCapture with POST and payload", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { operation_id: TEST_OPERATION_ID } } as never);

    const payload = buildServingGroupCapturePayload();

    await startServingGroupRxMerCapture(TEST_BASE_URL, payload);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.rxmer.start,
      data: payload,
      timeout: TEST_TIMEOUTS.start,
    });
  });

  it("calls status with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "completed" } } as never);

    await getServingGroupRxMerCaptureStatus(TEST_BASE_URL, TEST_OPERATION_ID);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.rxmer.status,
      data: {
        pnm_capture_operation_id: TEST_OPERATION_ID,
      },
      timeout: TEST_TIMEOUTS.status,
    });
  });

  it("calls cancel with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { state: "cancelling" } } as never);

    await cancelServingGroupRxMerCapture(TEST_BASE_URL, TEST_OPERATION_ID);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.rxmer.cancel,
      data: {
        pnm_capture_operation_id: TEST_OPERATION_ID,
      },
      timeout: TEST_TIMEOUTS.status,
    });
  });

  it("calls results with POST and pnm_capture_operation_id", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: { results: {} } } as never);

    await getServingGroupRxMerResults(TEST_BASE_URL, TEST_OPERATION_ID);

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.rxmer.results,
      data: {
        pnm_capture_operation_id: TEST_OPERATION_ID,
      },
      timeout: TEST_TIMEOUTS.status,
    });
  });
});
