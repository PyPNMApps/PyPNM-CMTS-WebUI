import { describe, expect, it, vi } from "vitest";

vi.mock("../src/services/http", () => ({
  requestWithBaseUrl: vi.fn(),
}));

import * as httpModule from "../src/services/http";
import { classifyHealthError, reloadWebService } from "../src/services/healthService";

describe("classifyHealthError", () => {
  it("marks timeout and network failures as unreachable", () => {
    expect(classifyHealthError(new Error("timeout of 4000ms exceeded"))).toEqual({
      status: "unreachable",
      message: "timeout of 4000ms exceeded",
    });
    expect(classifyHealthError(new Error("Network Error"))).toEqual({
      status: "unreachable",
      message: "Network Error",
    });
  });

  it("keeps non-network failures as error", () => {
    expect(classifyHealthError(new Error("503 upstream failure"))).toEqual({
      status: "error",
      message: "503 upstream failure",
    });
  });

  it("calls the web service reload endpoint with GET", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({ data: null } as never);

    await reloadWebService("http://127.0.0.1:8080/");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080/", {
      method: "GET",
      timeout: 15000,
      url: "/pypnm/system/webService/reload",
    });
  });
});
