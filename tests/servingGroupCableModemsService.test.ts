import { describe, expect, it, vi } from "vitest";

vi.mock("../src/services/http", () => ({
  requestWithBaseUrl: vi.fn(),
}));

import * as httpModule from "../src/services/http";
import { getServingGroupCableModems } from "../src/pcw/services/servingGroupCableModemsService";
import { TEST_BASE_URL, TEST_MAC_ADDRESS, TEST_MODEM_IPV4, TEST_OPERATION_URLS } from "./support/servingGroupTestConstants";

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
                mac_address: TEST_MAC_ADDRESS,
                ipv4: TEST_MODEM_IPV4,
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

    const rows = await getServingGroupCableModems(TEST_BASE_URL, [], "light");

    expect(requestWithBaseUrl).toHaveBeenCalledWith(TEST_BASE_URL, {
      method: "POST",
      url: TEST_OPERATION_URLS.cableModems,
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
    expect(rows[0]?.macAddress).toBe(TEST_MAC_ADDRESS.toLowerCase());
    expect(rows[0]?.ipAddress).toBe(TEST_MODEM_IPV4);
    expect(rows[0]?.dsChannelIds).toEqual([193, 194]);
    expect(rows[0]?.usChannelIds).toEqual([12]);
    expect(rows[0]?.channelIds).toEqual([12, 193, 194]);
  });
});
