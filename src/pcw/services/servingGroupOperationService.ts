import { ADVANCED_OPERATION_START_TIMEOUT_MS, ADVANCED_OPERATION_STATUS_TIMEOUT_MS } from "@/lib/constants";
import { requestWithBaseUrl } from "@/services/http";
import { buildOperationActionPath } from "@/pcw/services/apiPaths";

type OperationAction = "startCapture" | "status" | "cancel" | "results";

async function runServingGroupOperationRequest(
  baseUrl: string,
  basePath: string,
  action: OperationAction,
  data: unknown,
  timeout: number,
): Promise<unknown> {
  const response = await requestWithBaseUrl<unknown>(baseUrl, {
    method: "POST",
    url: buildOperationActionPath(basePath, action),
    data,
    timeout,
  });
  return response.data;
}

export function startServingGroupOperation<TPayload>(baseUrl: string, basePath: string, payload: TPayload): Promise<unknown> {
  return runServingGroupOperationRequest(
    baseUrl,
    basePath,
    "startCapture",
    payload,
    ADVANCED_OPERATION_START_TIMEOUT_MS,
  );
}

function buildOperationIdPayload(operationId: string) {
  return {
    pnm_capture_operation_id: operationId,
  };
}

export function getServingGroupOperationStatus(baseUrl: string, basePath: string, operationId: string): Promise<unknown> {
  return runServingGroupOperationRequest(
    baseUrl,
    basePath,
    "status",
    buildOperationIdPayload(operationId),
    ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  );
}

export function cancelServingGroupOperation(baseUrl: string, basePath: string, operationId: string): Promise<unknown> {
  return runServingGroupOperationRequest(
    baseUrl,
    basePath,
    "cancel",
    buildOperationIdPayload(operationId),
    ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  );
}

export function getServingGroupOperationResults(baseUrl: string, basePath: string, operationId: string): Promise<unknown> {
  return runServingGroupOperationRequest(
    baseUrl,
    basePath,
    "results",
    buildOperationIdPayload(operationId),
    ADVANCED_OPERATION_STATUS_TIMEOUT_MS,
  );
}
