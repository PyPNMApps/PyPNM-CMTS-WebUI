import { describe, expect, it, vi } from "vitest";

vi.mock("../src/services/http", () => ({
  requestWithBaseUrl: vi.fn(),
}));

import * as httpModule from "../src/services/http";
import { getServingGroupCableModems } from "../src/services/servingGroupCableModemsService";

describe("servingGroupCableModemsService", () => {
  it("calls endpoint with light refresh by default and normalizes rows", async () => {
    const requestWithBaseUrl = vi.mocked(httpModule.requestWithBaseUrl);
    requestWithBaseUrl.mockResolvedValueOnce({
      data: {
        groups: [
          {
            sg_id: 1,
            items: [
              {
                mac_address: "AA:BB:CC:DD:EE:FF",
                ipv4: "10.1.0.10",
                ds_channel_ids: [193, 194],
                us_channel_ids: [12],
                sysdescr: {
                  VENDOR: "LANCity",
                  MODEL: "LCPET-3",
                  SW_REV: "1.0.0",
                },
                registration_status: {
                  status: 8,
                  text: "operational",
                },
              },
            ],
          },
        ],
      },
    } as never);

    const rows = await getServingGroupCableModems("http://127.0.0.1:8080", [], "light");

    expect(requestWithBaseUrl).toHaveBeenCalledWith("http://127.0.0.1:8080", {
      method: "POST",
      url: "/cmts/servingGroup/operations/get/cableModems",
      data: {
        cmts: {
          serving_group: {
            id: [],
          },
        },
        refresh: {
          mode: "light",
          wait_for_cache: false,
          timeout_seconds: 8,
        },
      },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.macAddress).toBe("aa:bb:cc:dd:ee:ff");
    expect(rows[0]?.ipAddress).toBe("10.1.0.10");
    expect(rows[0]?.channelIds).toEqual([12, 193, 194]);
  });
});
