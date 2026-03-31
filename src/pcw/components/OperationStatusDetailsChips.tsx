interface OperationStatusSummaryLike {
  totalModems?: number | null;
  eligibleModems?: number | null;
  precheckPassed?: number | null;
  captureStarted?: number | null;
  successCount?: number | null;
  failedCount?: number | null;
  skippedCount?: number | null;
  createdEpoch?: number | null;
  startedEpoch?: number | null;
  updatedEpoch?: number | null;
  finishedEpoch?: number | null;
}

interface OperationStatusDetailsChipsProps {
  statusSummary: OperationStatusSummaryLike | null | undefined;
  formatEpoch: (value: number | undefined) => string;
}

export function OperationStatusDetailsChips({ statusSummary, formatEpoch }: OperationStatusDetailsChipsProps) {
  return (
    <details className="capture-request-dropdown operation-status-details">
      <summary className="capture-request-dropdown-summary">
        <span>Operation Details</span>
      </summary>
      <div className="status-chip-row operation-status-chip-row">
        <span className="analysis-chip"><b>Total Modems</b> {statusSummary?.totalModems ?? 0}</span>
        <span className="analysis-chip"><b>Eligible</b> {statusSummary?.eligibleModems ?? 0}</span>
        <span className="analysis-chip"><b>Precheck Passed</b> {statusSummary?.precheckPassed ?? 0}</span>
        <span className="analysis-chip"><b>Capture Started</b> {statusSummary?.captureStarted ?? 0}</span>
        <span className="analysis-chip"><b>Success</b> {statusSummary?.successCount ?? 0}</span>
        <span className="analysis-chip"><b>Failed</b> {statusSummary?.failedCount ?? 0}</span>
        <span className="analysis-chip"><b>Skipped</b> {statusSummary?.skippedCount ?? 0}</span>
      </div>
      <div className="status-chip-row operation-status-chip-row">
        <span className="analysis-chip"><b>Created</b> {formatEpoch(statusSummary?.createdEpoch ?? undefined)}</span>
        <span className="analysis-chip"><b>Started</b> {formatEpoch(statusSummary?.startedEpoch ?? undefined)}</span>
        <span className="analysis-chip"><b>Updated</b> {formatEpoch(statusSummary?.updatedEpoch ?? undefined)}</span>
        <span className="analysis-chip"><b>Finished</b> {formatEpoch(statusSummary?.finishedEpoch ?? undefined)}</span>
      </div>
    </details>
  );
}
