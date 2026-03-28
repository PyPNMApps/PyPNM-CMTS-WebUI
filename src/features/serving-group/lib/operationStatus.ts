import type { AdvancedOperationStatusSummary } from "@/features/advanced/useAdvancedOperationMachine";

function readPath(input: unknown, path: string[]): unknown {
  let current: unknown = input;
  for (const key of path) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function readString(input: unknown, ...paths: string[][]): string {
  for (const path of paths) {
    const value = readPath(input, path);
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return "";
}

function readNumber(input: unknown, fallback = 0, ...paths: string[][]): number {
  for (const path of paths) {
    const value = readPath(input, path);
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
}

function inferState(response: unknown): string {
  const explicitState = readString(response, ["operation", "state"], ["state"]);
  if (explicitState) {
    return explicitState;
  }
  const statusText = readString(response, ["status"]);
  if (statusText.toLowerCase() === "completed") {
    return "completed";
  }
  const completedFlag = readPath(response, ["operation", "completed"]);
  if (completedFlag === true) {
    return "completed";
  }
  const message = readString(response, ["operation", "message"], ["message"]).toLowerCase();
  if (message.includes("complete") || message.includes("completed") || message.includes("success")) {
    return "completed";
  }
  return "running";
}

function computeTimeRemainingSeconds(response: unknown, state: string): number {
  const normalizedState = state.trim().toLowerCase();
  if (normalizedState === "completed" || normalizedState === "failed" || normalizedState === "cancelled") {
    return 0;
  }
  const overallTimeout = readNumber(response, 0, ["operation", "request_summary", "execution", "overall_timeout_seconds"]);
  if (overallTimeout <= 0) {
    return 0;
  }
  const startedEpoch = readNumber(response, 0, ["operation", "timestamps", "started_epoch"]);
  if (startedEpoch <= 0) {
    return Math.ceil(overallTimeout);
  }
  const updatedEpoch = readNumber(response, 0, ["operation", "timestamps", "updated_epoch"]);
  const nowEpoch = Math.floor(Date.now() / 1000);
  const referenceEpoch = updatedEpoch > 0 ? updatedEpoch : nowEpoch;
  const elapsedSeconds = Math.max(0, referenceEpoch - startedEpoch);
  return Math.max(0, Math.ceil(overallTimeout - elapsedSeconds));
}

export function parseServingGroupOperationStartResponse(
  response: unknown,
  fallbackGroupId = "serving-group",
): { groupId: string; operationId: string; message?: string | null } {
  const operationId = readString(
    response,
    ["pnm_capture_operation_id"],
    ["operation_id"],
    ["operation", "operation_id"],
    ["operation", "pnm_capture_operation_id"],
  );
  if (!operationId) {
    throw new Error("Start capture response did not include operation_id.");
  }
  const groupId = readString(response, ["group_id"], ["cmts", "serving_group", "id"]) || fallbackGroupId;
  const message = readString(response, ["message"], ["operation", "message"]) || null;
  return { groupId, operationId, message };
}

export function parseServingGroupOperationStatusResponse(response: unknown): AdvancedOperationStatusSummary {
  const operationId = readString(
    response,
    ["pnm_capture_operation_id"],
    ["operation", "operation_id"],
    ["operation_id"],
    ["operation", "pnm_capture_operation_id"],
    ["operation", "id"],
  ) || "unknown-operation";
  const state = inferState(response);
  const collected = readNumber(response, 0, ["operation", "counters", "completed"], ["operation", "collected"], ["collected"]);
  const timeRemaining = computeTimeRemainingSeconds(response, state);
  const message = readString(response, ["operation", "message"], ["operation", "error_summary", "message"], ["message"]) || null;

  return {
    operationId,
    state,
    collected,
    timeRemaining,
    message,
    totalModems: readNumber(response, 0, ["operation", "counters", "total_modems"]),
    eligibleModems: readNumber(response, 0, ["operation", "counters", "eligible_modems"]),
    precheckPassed: readNumber(response, 0, ["operation", "counters", "precheck_passed"]),
    captureStarted: readNumber(response, 0, ["operation", "counters", "capture_started"]),
    successCount: readNumber(response, 0, ["operation", "counters", "success"]),
    failedCount: readNumber(response, 0, ["operation", "counters", "failed"]),
    skippedCount: readNumber(response, 0, ["operation", "counters", "skipped"]),
    createdEpoch: readNumber(response, 0, ["operation", "timestamps", "created_epoch"]),
    startedEpoch: readNumber(response, 0, ["operation", "timestamps", "started_epoch"]),
    updatedEpoch: readNumber(response, 0, ["operation", "timestamps", "updated_epoch"]),
    finishedEpoch: readNumber(response, 0, ["operation", "timestamps", "finished_epoch"]),
  };
}

export function formatOperationEpoch(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "n/a";
  }
  return new Date(value * 1000).toLocaleString();
}
