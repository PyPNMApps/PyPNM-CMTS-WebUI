import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ADVANCED_OPERATION_POLL_INTERVAL_MS } from "@/lib/constants";

export type AdvancedOperationLifecycleState = "idle" | "starting" | "running" | "stopping" | "completed" | "stopped" | "failed";

export interface AdvancedOperationStatusSummary {
  operationId: string;
  state: string;
  collected: number;
  timeRemaining: number;
  message?: string | null;
  macAddress?: string | null;
  model?: string | null;
  vendor?: string | null;
  totalModems?: number;
  eligibleModems?: number;
  precheckPassed?: number;
  captureStarted?: number;
  successCount?: number;
  failedCount?: number;
  skippedCount?: number;
  createdEpoch?: number;
  startedEpoch?: number;
  updatedEpoch?: number;
  finishedEpoch?: number;
}

interface UseAdvancedOperationMachineOptions<TStartResponse, TStatusResponse> {
  pollIntervalMs?: number;
  stopEnableDelayMs?: number;
  parseStart: (response: TStartResponse) => { groupId: string; operationId: string; message?: string | null };
  parseStatus: (response: TStatusResponse) => AdvancedOperationStatusSummary;
  startOperation: () => Promise<TStartResponse>;
  getStatus: (operationId: string) => Promise<TStatusResponse>;
  stopOperation: (operationId: string) => Promise<TStatusResponse>;
}

function mapBackendState(state: string): AdvancedOperationLifecycleState {
  const normalized = state.toLowerCase();
  if (normalized === "queued") return "starting";
  if (normalized === "running") return "running";
  if (normalized === "cancelling") return "stopping";
  if (normalized === "cancelled") return "stopped";
  if (normalized === "stopped") return "stopped";
  if (normalized === "completed" || normalized === "success") return "completed";
  if (normalized === "failed" || normalized === "error" || normalized === "unknown") return "failed";
  return "running";
}

export function useAdvancedOperationMachine<TStartResponse, TStatusResponse>({
  pollIntervalMs = ADVANCED_OPERATION_POLL_INTERVAL_MS,
  stopEnableDelayMs = 1200,
  parseStart,
  parseStatus,
  startOperation,
  getStatus,
  stopOperation,
}: UseAdvancedOperationMachineOptions<TStartResponse, TStatusResponse>) {
  const [lifecycleState, setLifecycleState] = useState<AdvancedOperationLifecycleState>("idle");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [operationId, setOperationId] = useState<string | null>(null);
  const [startMessage, setStartMessage] = useState<string | null>(null);
  const [statusSummary, setStatusSummary] = useState<AdvancedOperationStatusSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [stopEnabled, setStopEnabled] = useState(false);
  const pollTimerRef = useRef<number | null>(null);
  const stopEnableTimerRef = useRef<number | null>(null);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const clearStopEnableTimer = useCallback(() => {
    if (stopEnableTimerRef.current !== null) {
      window.clearTimeout(stopEnableTimerRef.current);
      stopEnableTimerRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async (currentOperationId: string) => {
    try {
      setIsPolling(true);
      const statusResponse = await getStatus(currentOperationId);
      const summary = parseStatus(statusResponse);
      setStatusSummary(summary);
      const mappedState = mapBackendState(summary.state);
      setLifecycleState(mappedState);
      setErrorMessage(null);
      if (mappedState === "running") {
        clearPollTimer();
        pollTimerRef.current = window.setTimeout(() => {
          void pollOnce(currentOperationId);
        }, pollIntervalMs);
      }
    } catch (error) {
      setLifecycleState("failed");
      setErrorMessage(error instanceof Error ? error.message : "Failed to poll operation status.");
    } finally {
      setIsPolling(false);
    }
  }, [clearPollTimer, getStatus, parseStatus, pollIntervalMs]);

  useEffect(() => {
    return () => {
      clearPollTimer();
      clearStopEnableTimer();
    };
  }, [clearPollTimer, clearStopEnableTimer]);

  const start = useCallback(async () => {
    clearPollTimer();
    clearStopEnableTimer();
    setLifecycleState("starting");
    setErrorMessage(null);
    setGroupId(null);
    setOperationId(null);
    setStartMessage(null);
    setStatusSummary(null);
    setStopEnabled(false);
    try {
      const response = await startOperation();
      const parsed = parseStart(response);
      setGroupId(parsed.groupId);
      setOperationId(parsed.operationId);
      setStartMessage(parsed.message ?? null);
      setLifecycleState("running");
      stopEnableTimerRef.current = window.setTimeout(() => {
        setStopEnabled(true);
      }, stopEnableDelayMs);
      void pollOnce(parsed.operationId);
    } catch (error) {
      setLifecycleState("failed");
      setErrorMessage(error instanceof Error ? error.message : "Failed to start operation.");
      setStopEnabled(false);
    }
  }, [clearPollTimer, clearStopEnableTimer, parseStart, pollOnce, startOperation, stopEnableDelayMs]);

  const stop = useCallback(async () => {
    if (!operationId) return;
    clearPollTimer();
    clearStopEnableTimer();
    setLifecycleState("stopping");
    setErrorMessage(null);
    setStopEnabled(false);
    try {
      const response = await stopOperation(operationId);
      const summary = parseStatus(response);
      setStatusSummary(summary);
      setLifecycleState(mapBackendState(summary.state));
    } catch (error) {
      setLifecycleState("failed");
      setErrorMessage(error instanceof Error ? error.message : "Failed to stop operation.");
    }
  }, [clearPollTimer, clearStopEnableTimer, operationId, parseStatus, stopOperation]);

  const refreshStatus = useCallback(async () => {
    if (!operationId) return;
    clearPollTimer();
    await pollOnce(operationId);
  }, [clearPollTimer, operationId, pollOnce]);

  const trackOperation = useCallback(async (nextOperationId: string) => {
    const normalizedOperationId = nextOperationId.trim();
    if (!normalizedOperationId) {
      return;
    }
    clearPollTimer();
    clearStopEnableTimer();
    setGroupId(null);
    setOperationId(normalizedOperationId);
    setStartMessage(null);
    setStatusSummary(null);
    setErrorMessage(null);
    setLifecycleState("running");
    setStopEnabled(true);
    await pollOnce(normalizedOperationId);
  }, [clearPollTimer, clearStopEnableTimer, pollOnce]);

  const canStart = useMemo(() => lifecycleState !== "starting" && lifecycleState !== "running" && lifecycleState !== "stopping", [lifecycleState]);
  const canStop = lifecycleState === "running" && Boolean(operationId) && stopEnabled;
  const hasOperation = Boolean(operationId);

  return {
    lifecycleState,
    groupId,
    operationId,
    startMessage,
    statusSummary,
    errorMessage,
    isPolling,
    canStart,
    canStop,
    hasOperation,
    start,
    stop,
    refreshStatus,
    trackOperation,
  };
}
