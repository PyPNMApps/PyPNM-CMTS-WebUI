// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAdvancedOperationMachine } from "@/features/advanced/useAdvancedOperationMachine";

describe("useAdvancedOperationMachine", () => {
  it("can track an existing operation id and load status", async () => {
    const getStatus = vi.fn().mockResolvedValue({
      operation_id: "op-42",
      operation: {
        state: "completed",
      },
    });

    const { result } = renderHook(() => useAdvancedOperationMachine({
      parseStart: () => ({ groupId: "sg-1", operationId: "new-op" }),
      parseStatus: () => ({
        operationId: "op-42",
        state: "completed",
        collected: 3,
        timeRemaining: 0,
      }),
      startOperation: async () => ({}),
      getStatus,
      stopOperation: async () => ({}),
    }));

    await act(async () => {
      await result.current.trackOperation("op-42");
    });

    expect(getStatus).toHaveBeenCalledWith("op-42");
    expect(result.current.operationId).toBe("op-42");
    expect(result.current.lifecycleState).toBe("completed");
    expect(result.current.statusSummary?.operationId).toBe("op-42");
  });
});
