interface ExportActionsProps {
  onPng?: (() => void | Promise<void>) | null;
  onCsv?: (() => void) | null;
  pngLabel?: string;
  csvLabel?: string;
}

export function ExportActions({
  onPng = null,
  onCsv = null,
  pngLabel = "PNG",
  csvLabel = "CSV",
}: ExportActionsProps) {
  if (!onPng && !onCsv) {
    return null;
  }

  return (
    <div className="operations-export-actions">
      {onPng ? (
        <button type="button" className="operations-json-download" onClick={() => void onPng()}>
          {pngLabel}
        </button>
      ) : null}
      {onCsv ? (
        <button type="button" className="operations-json-download" onClick={onCsv}>
          {csvLabel}
        </button>
      ) : null}
    </div>
  );
}
