import { describe, expect, it, vi } from "vitest";

import { sanitizeRawConfig } from "../src/lib/instanceConfig";

describe("sanitizeRawConfig", () => {
  it("logs duplicate runtime ids and keeps the first entry", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const sanitized = sanitizeRawConfig(
      {
        version: 1,
        instances: [
          {
            id: "lab-local",
            label: "Lab Local A",
            base_url: "http://127.0.0.1:8000",
          },
          {
            id: "lab-local",
            label: "Lab Local B",
            base_url: "http://127.0.0.2:8000",
          },
          {
            id: "rack-2",
            label: "Rack 2",
            base_url: "http://10.0.0.5:8000",
          },
        ],
      },
      "/config/pypnm-instances.local.yaml",
    );

    expect(sanitized.instances).toHaveLength(2);
    expect(sanitized.instances?.[0]).toMatchObject({
      id: "lab-local",
      label: "Lab Local A",
    });
    expect(sanitized.instances?.[1]).toMatchObject({
      id: "rack-2",
      label: "Rack 2",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "Duplicate PyPNM agent ids found in /config/pypnm-instances.local.yaml: lab-local. Keeping first occurrence only.",
    );

    warnSpy.mockRestore();
  });
});
