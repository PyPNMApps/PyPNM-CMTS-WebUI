import { describe, expect, it } from "vitest";

import { getHealth } from "@/services/healthService";

const liveBaseUrl = process.env.PYPNM_LIVE_BASE_URL ?? "http://127.0.0.1:8000";
const liveHealthPath = process.env.PYPNM_LIVE_HEALTH_PATH ?? "/health";
const runLiveHealthCheck = process.env.RUN_LIVE_PYPNM_HEALTH === "1";

const liveDescribe = runLiveHealthCheck ? describe : describe.skip;

liveDescribe("live PyPNM health integration", () => {
  it("connects to a live PyPNM instance through the WebUI health service", async () => {
    const response = await getHealth(liveBaseUrl, liveHealthPath);

    expect(response.status).toBe("ok");
    expect(typeof response.service?.version).toBe("string");
  });
});
