import type { ReactNode } from "react";

import { Panel } from "@/components/common/Panel";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";

interface CaptureOperationShellProps {
  captureInputsTitle: ReactNode;
  requestForm: ReactNode;
  isPending: boolean;
  pendingLabel: string;
  hasSelectedResponse: boolean;
  resultsView: ReactNode;
}

export function CaptureOperationShell({
  captureInputsTitle,
  requestForm,
  isPending,
  pendingLabel,
  hasSelectedResponse,
  resultsView,
}: CaptureOperationShellProps) {
  return (
    <>
      <Panel title={captureInputsTitle}>
        {requestForm}
      </Panel>

      {isPending ? (
        <Panel>
          <ThinkingIndicator label={pendingLabel} />
        </Panel>
      ) : null}

      <Panel title="Results">
        {!hasSelectedResponse ? (
          <div className="details-table-wrap">
            <table className="details-table">
              <tbody>
                <tr>
                  <th>State</th>
                  <td>N/A</td>
                </tr>
                <tr>
                  <th>Result</th>
                  <td>No capture results yet. Run the operation to populate this panel.</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : resultsView}
      </Panel>
    </>
  );
}
