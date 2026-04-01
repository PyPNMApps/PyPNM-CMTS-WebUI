import { describe, expect, it } from "vitest";

import { parseServeArgs } from "../tools/cli/pypnm_cmts_webui_cli.js";

describe("pypnm_webui_cli serve args", () => {
  it("parses --start-local-pypnm-docsis", () => {
    const parsed = parseServeArgs(["--start-local-pypnm-docsis"]);
    if ("exitCode" in parsed) {
      throw new Error(`unexpected exit code: ${parsed.exitCode}`);
    }
    expect(parsed.options.startLocalPyPnmDocsis).toBe(true);
  });

  it("parses --run-background", () => {
    const parsed = parseServeArgs(["--run-background"]);
    if ("exitCode" in parsed) {
      throw new Error(`unexpected exit code: ${parsed.exitCode}`);
    }
    expect(parsed.options.runBackground).toBe(true);
  });

  it("rejects missing values for valued serve arguments", () => {
    const parsed = parseServeArgs(["--host"]);
    expect("exitCode" in parsed ? parsed.exitCode : -1).toBe(2);
  });
});
