import { HistogramBarChart } from "@/pw/features/operations/HistogramBarChart";
import type { RxMerSelectionInsights } from "@/lib/rxMerSelectionInsights";

export interface RxMerSelectionModalState {
  channelId: string;
  selectionStartMhz: number;
  selectionEndMhz: number;
  insights: RxMerSelectionInsights;
}

export function RxMerSelectionInsightsModal({
  data,
  exportBaseName,
  onClose,
}: {
  data: RxMerSelectionModalState | null;
  exportBaseName: string;
  onClose: () => void;
}) {
  if (!data) {
    return null;
  }

  return (
    <div
      className="selection-insights-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Selected RxMER Region Insights"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="selection-insights-modal-card">
        <div className="selection-insights-modal-header">
          <h3 className="selection-insights-modal-title">Selected RxMER Region Insights</h3>
          <button
            type="button"
            className="analysis-chip-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="status-chip-row">
          <span className="analysis-chip"><b>Channel</b> {data.channelId}</span>
          <span className="analysis-chip">
            <b>Range</b> {data.selectionStartMhz.toFixed(3)} - {data.selectionEndMhz.toFixed(3)} MHz
          </span>
          <span className="analysis-chip"><b>Points</b> {data.insights.pointCount}</span>
        </div>
        <div className="selection-insights-metrics-grid">
          <div className="analysis-small-metric">
            <div className="analysis-small-k">Avg MER</div>
            <div className="analysis-small-v">{data.insights.avgMerDb.toFixed(2)} dB</div>
          </div>
          <div className="analysis-small-metric">
            <div className="analysis-small-k">Estimated Bitload</div>
            <div className="analysis-small-v">{data.insights.estimatedBitloadBitsPerSymbol.toFixed(2)} bits/sym</div>
          </div>
          <div className="analysis-small-metric">
            <div className="analysis-small-k">
              <span>Error-Free QAM</span>
              <span
                className="field-hint"
                title="QAM modulation level expected to run without FEC codeword correction in the selected region."
                aria-label="QAM modulation level expected to run without FEC codeword correction in the selected region."
              >
                ?
              </span>
            </div>
            <div className="analysis-small-v">{data.insights.safeQamLabel}</div>
          </div>
          <div className="analysis-small-metric">
            <div className="analysis-small-k">Min / Max MER</div>
            <div className="analysis-small-v">
              {data.insights.minMerDb.toFixed(2)} / {data.insights.maxMerDb.toFixed(2)} dB
            </div>
          </div>
        </div>
        <HistogramBarChart
          title="MER Distribution (Selected Region)"
          values={data.insights.distributionBins.map((bin) => bin.count)}
          xAxisLabel="RxMER (dB)"
          yAxisLabel="Carrier Count"
          xTickLabels={data.insights.distributionBins.map((bin) => ((bin.startMer + bin.endMer) / 2).toFixed(1))}
          showAllXTickLabels
          exportBaseName={exportBaseName}
        />
      </div>
    </div>
  );
}
