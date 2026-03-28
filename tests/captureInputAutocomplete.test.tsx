import { describe, expect, it } from "vitest";

import { captureInputAutocomplete } from "@/features/operations/captureInputAutocomplete";

describe("capture input autocomplete", () => {
  it("defines stable browser autocomplete tokens for capture identity inputs", () => {
    expect(captureInputAutocomplete.macAddress).toBe("section-capture mac-address");
    expect(captureInputAutocomplete.ipAddress).toBe("section-capture ip-address");
    expect(captureInputAutocomplete.community).toBe("section-capture snmp-community");
  });
});
