interface OperationStatusPrimaryChipsProps {
  lifecycleState: string;
  operationId: string | null;
  collected: number | null | undefined;
  timeRemainingSeconds: number | null | undefined;
}

export function OperationStatusPrimaryChips({
  lifecycleState,
  operationId,
  collected,
  timeRemainingSeconds,
}: OperationStatusPrimaryChipsProps) {
  return (
    <div className="status-chip-row operation-status-chip-row">
      <span className="analysis-chip"><b>State</b> {lifecycleState.toUpperCase()}</span>
      <span className="analysis-chip"><b>Operation ID</b> {operationId ?? "n/a"}</span>
      <span className="analysis-chip"><b>Collected</b> {collected ?? 0}</span>
      <span className="analysis-chip"><b>Time Remaining</b> {timeRemainingSeconds ?? 0}s</span>
    </div>
  );
}
