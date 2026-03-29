interface ServingGroupSpectrumFriendlyResultsViewProps {
  payload: unknown;
}

interface SpectrumFriendlyRecord {
  key: string;
  sgId: string;
  macAddress: string;
  stage: string;
  statusCode: string;
  channelId: string;
  startedEpoch: string;
  finishedEpoch: string;
  filenames: string[];
  transactionIds: string[];
  failureReason: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toDisplay(value: unknown): string {
  if (value === null || value === undefined) {
    return "n/a";
  }
  if (typeof value === "string") {
    return value.trim() || "n/a";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "n/a";
}

function normalizeRecords(payload: unknown): SpectrumFriendlyRecord[] {
  const root = asRecord(payload);
  const records = asArray(root?.records);
  return records.map((entry, index) => {
    const record = asRecord(entry);
    const sgId = toDisplay(record?.sg_id);
    const macAddress = toDisplay(record?.mac_address).toLowerCase();
    const stage = toDisplay(record?.stage);
    const statusCode = toDisplay(record?.status_code);
    const channelId = toDisplay(record?.channel_id);
    const startedEpoch = toDisplay(record?.started_epoch);
    const finishedEpoch = toDisplay(record?.finished_epoch);
    const filenames = asArray(record?.filenames).map((item) => toDisplay(item)).filter((item) => item !== "n/a");
    const transactionIds = asArray(record?.transaction_ids).map((item) => toDisplay(item)).filter((item) => item !== "n/a");
    const failureReason = toDisplay(record?.failure_reason);

    return {
      key: `${sgId}-${macAddress}-${index}`,
      sgId,
      macAddress,
      stage,
      statusCode,
      channelId,
      startedEpoch,
      finishedEpoch,
      filenames,
      transactionIds,
      failureReason,
    };
  });
}

function summaryValue(root: Record<string, unknown> | null, key: string): string {
  const summary = asRecord(root?.summary);
  return toDisplay(summary?.[key]);
}

export function ServingGroupSpectrumFriendlyResultsView({ payload }: ServingGroupSpectrumFriendlyResultsViewProps) {
  const root = asRecord(payload);
  const records = normalizeRecords(payload);
  const status = toDisplay(root?.status);
  const message = toDisplay(root?.message);

  if (records.length === 0) {
    return <p className="panel-copy">No Spectrum Analyzer Friendly linkage records available yet.</p>;
  }

  return (
    <div className="operations-visual-stack">
      <article className="chart-frame">
        <div className="status-chip-row operation-status-chip-row">
          <span className="analysis-chip"><b>Status</b> {status}</span>
          <span className="analysis-chip"><b>Message</b> {message}</span>
          <span className="analysis-chip"><b>Total</b> {summaryValue(root, "total_records")}</span>
          <span className="analysis-chip"><b>Included</b> {summaryValue(root, "included_records")}</span>
          <span className="analysis-chip"><b>Excluded</b> {summaryValue(root, "excluded_records")}</span>
        </div>
      </article>
      <details className="chart-frame capture-request-dropdown" open>
        <summary className="capture-request-dropdown-summary">
          <span>Friendly Linkage Records</span>
          <span className="capture-request-group-meta">Per-modem file linkage from SG spectrum analyzer operation</span>
        </summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SG</th>
                <th>MAC Address</th>
                <th>Stage</th>
                <th>Status Code</th>
                <th>Channel</th>
                <th>Transaction IDs</th>
                <th>Filenames</th>
                <th>Failure Reason</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.key}>
                  <td>{record.sgId}</td>
                  <td className="mono">{record.macAddress}</td>
                  <td>{record.stage}</td>
                  <td>{record.statusCode}</td>
                  <td>{record.channelId}</td>
                  <td>{record.transactionIds.length ? record.transactionIds.join(", ") : "n/a"}</td>
                  <td>{record.filenames.length ? record.filenames.join(", ") : "n/a"}</td>
                  <td>{record.failureReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

