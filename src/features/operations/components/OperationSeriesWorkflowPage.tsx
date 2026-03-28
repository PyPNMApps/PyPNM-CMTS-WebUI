import { useMemo, useState } from "react";

import { useInstanceConfig } from "@/app/useInstanceConfig";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { buildOperationRequestExample, getOperationById } from "@/features/operations/registry";
import { runOperationSeriesEndpoint } from "@/services/operationSeriesService";

interface WorkflowStepDefinition {
  key: string;
  title: string;
  operationId: string;
  requiresOperationId?: boolean;
  captureOperationIdFromResponse?: boolean;
}

interface OperationSeriesWorkflowPageProps {
  title: string;
  subtitle: string;
  workflowId: string;
  steps: WorkflowStepDefinition[];
}

interface OperationResponseWithOperationId {
  operation?: {
    operation_id?: string;
  };
}

function prettyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readOperationId(response: unknown): string {
  const maybeResponse = response as OperationResponseWithOperationId | undefined;
  return maybeResponse?.operation?.operation_id?.trim() ?? "";
}

function injectOperationId(rawPayload: string, operationId: string): string {
  try {
    const parsed = JSON.parse(rawPayload) as Record<string, unknown>;
    const operation = typeof parsed.operation === "object" && parsed.operation !== null
      ? { ...(parsed.operation as Record<string, unknown>) }
      : {};
    operation.pnm_capture_operation_id = operationId;
    parsed.operation = operation;
    return prettyJson(parsed);
  } catch {
    return rawPayload;
  }
}

export function OperationSeriesWorkflowPage({ title, subtitle, workflowId, steps }: OperationSeriesWorkflowPageProps) {
  const { selectedInstance } = useInstanceConfig();

  const resolvedSteps = useMemo(() => {
    return steps.map((step) => {
      const operation = getOperationById(step.operationId);
      if (!operation) {
        throw new Error(`Missing operation registry entry: ${step.operationId}`);
      }
      return { ...step, operation };
    });
  }, [steps]);

  const [operationId, setOperationId] = useState("");
  const [activeStepKey, setActiveStepKey] = useState<string | null>(null);
  const [payloads, setPayloads] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const step of resolvedSteps) {
      next[step.key] = buildOperationRequestExample(step.operation);
    }
    return next;
  });
  const [responses, setResponses] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const step of resolvedSteps) {
      next[step.key] = "";
    }
    return next;
  });
  const [errors, setErrors] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const step of resolvedSteps) {
      next[step.key] = "";
    }
    return next;
  });

  const hasInstance = Boolean(selectedInstance?.baseUrl);
  const canRunOperationLookup = operationId.trim().length > 0;

  async function runStep(stepKey: string) {
    const step = resolvedSteps.find((entry) => entry.key === stepKey);
    if (!step) {
      return;
    }

    if (!selectedInstance?.baseUrl) {
      setErrors((current) => ({ ...current, [step.key]: "No instance selected." }));
      return;
    }

    if (step.requiresOperationId && !canRunOperationLookup) {
      setErrors((current) => ({ ...current, [step.key]: "Run Start Capture first (or set operation id)." }));
      return;
    }

    setActiveStepKey(step.key);
    setErrors((current) => ({ ...current, [step.key]: "" }));

    try {
      const parsedPayload = JSON.parse(payloads[step.key]);
      const response = await runOperationSeriesEndpoint<unknown>(
        selectedInstance.baseUrl,
        step.operation.endpointPath,
        parsedPayload,
      );
      setResponses((current) => ({ ...current, [step.key]: prettyJson(response) }));

      if (step.captureOperationIdFromResponse) {
        const discoveredOperationId = readOperationId(response);
        if (discoveredOperationId) {
          setOperationId(discoveredOperationId);
          setPayloads((current) => {
            const next = { ...current };
            for (const candidate of resolvedSteps) {
              if (candidate.requiresOperationId) {
                next[candidate.key] = injectOperationId(next[candidate.key], discoveredOperationId);
              }
            }
            return next;
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      setErrors((current) => ({ ...current, [step.key]: message }));
    } finally {
      setActiveStepKey(null);
    }
  }

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      <Panel title="Operation Context">
        <div className="grid">
          <div className="field">
            <label htmlFor={`${workflowId}-base-url`}>Base URL</label>
            <input id={`${workflowId}-base-url`} value={selectedInstance?.baseUrl ?? ""} readOnly />
          </div>
          <div className="field">
            <label htmlFor={`${workflowId}-operation-id`}>Operation ID</label>
            <input
              id={`${workflowId}-operation-id`}
              value={operationId}
              onChange={(event) => {
                setOperationId(event.target.value);
              }}
              placeholder="operation-id from startCapture"
            />
          </div>
        </div>
      </Panel>

      {resolvedSteps.map((step) => {
        const isPending = activeStepKey === step.key;
        const disabled = !hasInstance || (step.requiresOperationId && !canRunOperationLookup) || isPending;
        const payload = payloads[step.key] ?? "";
        const response = responses[step.key] ?? "";
        const error = errors[step.key] ?? "";

        return (
          <Panel key={step.key} title={step.title}>
            <div className="field">
              <label htmlFor={`${workflowId}-endpoint-${step.key}`}>Endpoint</label>
              <input id={`${workflowId}-endpoint-${step.key}`} value={step.operation.endpointPath} readOnly />
            </div>
            <div className="field">
              <label htmlFor={`${workflowId}-payload-${step.key}`}>Request JSON</label>
              <textarea
                id={`${workflowId}-payload-${step.key}`}
                className="mono"
                value={payload}
                onChange={(event) => {
                  const nextPayload = event.target.value;
                  setPayloads((current) => ({ ...current, [step.key]: nextPayload }));
                }}
                rows={18}
              />
            </div>
            <div className="actions">
              <button
                type="button"
                className="primary"
                disabled={disabled}
                onClick={() => {
                  void runStep(step.key);
                }}
              >
                {isPending ? "Running..." : `Run ${step.title}`}
              </button>
            </div>
            {error ? <p className="panel-copy">{error}</p> : null}
            <div className="field">
              <label htmlFor={`${workflowId}-response-${step.key}`}>Response</label>
              <textarea
                id={`${workflowId}-response-${step.key}`}
                className="mono"
                value={response}
                readOnly
                rows={14}
              />
            </div>
          </Panel>
        );
      })}
    </>
  );
}
