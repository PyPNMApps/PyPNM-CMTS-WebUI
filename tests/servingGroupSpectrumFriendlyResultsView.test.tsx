// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServingGroupSpectrumFriendlyResultsView } from "../src/features/spectrum-analyzer/components/ServingGroupSpectrumFriendlyResultsView";

describe("ServingGroupSpectrumFriendlyResultsView", () => {
  it("renders friendly linkage summary chips and record table", () => {
    const payload = {
      status: 0,
      message: "",
      summary: {
        total_records: 1,
        included_records: 1,
        excluded_records: 0,
      },
      records: [
        {
          pnm_capture_operation_id: "op-1",
          sg_id: 1,
          mac_address: "AA:BB:CC:DD:EE:FF",
          stage: "capture",
          status_code: 0,
          channel_id: 193,
          transaction_ids: ["6384a946c75ce10a"],
          filenames: ["capture.bin"],
        },
      ],
    };

    render(<ServingGroupSpectrumFriendlyResultsView payload={payload} />);
    expect(screen.getByText("Friendly Linkage Records")).toBeTruthy();
    expect(screen.getByText("aa:bb:cc:dd:ee:ff")).toBeTruthy();
    expect(screen.getByText("capture.bin")).toBeTruthy();
  });
});

