import { describe, expect, it } from "vitest";

import { parseOpenApiEndpoints } from "@/features/endpoint-explorer/openApi";

describe("parseOpenApiEndpoints", () => {
  it("extracts and sorts endpoints from an OpenAPI document", () => {
    const endpoints = parseOpenApiEndpoints({
      paths: {
        "/health": {
          get: {
            summary: "Health",
            operationId: "health",
            tags: ["health"],
          },
        },
        "/docs/pnm/ds/ofdm/rxMer/getCapture": {
          post: {
            summary: "Get RxMER",
            operationId: "get_rxmer_capture",
            tags: ["PNM", "OFDM"],
          },
        },
      },
    });

    expect(endpoints).toEqual([
      {
        method: "POST",
        operation_id: "get_rxmer_capture",
        path: "/docs/pnm/ds/ofdm/rxMer/getCapture",
        summary: "Get RxMER",
        tags: ["PNM", "OFDM"],
      },
      {
        method: "GET",
        operation_id: "health",
        path: "/health",
        summary: "Health",
        tags: ["health"],
      },
    ]);
  });
});
