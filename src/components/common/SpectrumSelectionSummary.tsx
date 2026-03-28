import type { SpectrumIntegratedPower, SpectrumSelectionRange } from "@/lib/spectrumPower";

function formatMhz(value: number): string {
  return `${value.toFixed(3)} MHz`;
}

function formatDbmv(value: number | null): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)} dBmV` : "n/a";
}

export function SpectrumSelectionSummary({
  selection,
  integratedPower,
  emptyMessage = "Drag across the graph to select a frequency range.",
}: {
  selection: SpectrumSelectionRange | null;
  integratedPower: SpectrumIntegratedPower[];
  emptyMessage?: string;
}) {
  if (!selection) {
    return <p className="panel-copy">{emptyMessage}</p>;
  }

  return (
    <div className="analysis-summary-grid">
      <div className="analysis-metric-card">
        <div className="analysis-metric-label">Selected Start</div>
        <div className="analysis-metric-value mono">{formatMhz(Math.min(selection.startX, selection.endX))}</div>
      </div>
      <div className="analysis-metric-card">
        <div className="analysis-metric-label">Selected End</div>
        <div className="analysis-metric-value mono">{formatMhz(Math.max(selection.startX, selection.endX))}</div>
      </div>
      <div className="analysis-metric-card">
        <div className="analysis-metric-label">Span</div>
        <div className="analysis-metric-value mono">{formatMhz(Math.abs(selection.endX - selection.startX))}</div>
      </div>
      {integratedPower.map((entry) => (
        <div key={entry.label} className="analysis-metric-card">
          <div className="analysis-metric-label">{entry.label} Selected Power</div>
          <div className="analysis-metric-value mono">{formatDbmv(entry.totalPowerDbmv)}</div>
          <div className="chart-meta mono">{entry.pointCount} pts</div>
        </div>
      ))}
    </div>
  );
}
