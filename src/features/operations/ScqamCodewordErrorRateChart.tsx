import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";

interface ScqamCodewordErrorRateChartDatum {
  channelId: string;
  totalCodewords: number;
  totalErrors: number;
}

interface ScqamCodewordErrorRateChartProps {
  title: string;
  values: ScqamCodewordErrorRateChartDatum[];
  exportBaseName?: string;
}

export function ScqamCodewordErrorRateChart({ title, values, exportBaseName }: ScqamCodewordErrorRateChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  if (!values.length) {
    return <p className="panel-copy">No SCQAM codeword error rate data available.</p>;
  }

  const width = 1100;
  const height = 360;
  const left = 56;
  const top = 24;
  const usableWidth = width - 86;
  const usableHeight = height - 82;
  const yMax = Math.max(1, ...values.flatMap((value) => [value.totalCodewords, value.totalErrors]));
  const groupWidth = usableWidth / values.length;
  const barWidth = Math.max(8, Math.min(30, (groupWidth - 12) / 2));

  return (
    <div className="chart-frame">
      <div className="chart-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-meta">Total codewords and total errors by downstream channel ID</div>
        </div>
        <div className="status-chip-row">
          <span className="analysis-chip">
            <span className="analysis-swatch" style={{ backgroundColor: "#79a9ff" }} />
            Total Codewords
          </span>
          <span className="analysis-chip">
            <span className="analysis-swatch" style={{ backgroundColor: "#ff6f91" }} />
            Total Errors
          </span>
        </div>
        {exportBaseName ? (
          <ExportActions
            onPng={() => {
              if (!svgRef.current) return;
              return downloadSvgAsPng(exportBaseName, svgRef.current);
            }}
            onCsv={() => downloadCsv(exportBaseName, values.map((value) => ({ ...value })))}
          />
        ) : null}
      </div>
      <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
        {Array.from({ length: 5 }, (_, index) => {
          const value = (yMax / 4) * index;
          const y = top + usableHeight - (value / yMax) * usableHeight;
          return (
            <g key={`y-${value}`}>
              <line x1={left} y1={y} x2={width - 20} y2={y} stroke="rgba(255,255,255,0.10)" />
              <text x="10" y={y + 4} fill="#9eb0c9" fontSize="11">
                {Math.round(value).toLocaleString("en-US")}
              </text>
            </g>
          );
        })}
        <line x1={left} y1={height - 42} x2={width - 20} y2={height - 42} stroke="rgba(255,255,255,0.20)" />
        <line x1={left} y1={top} x2={left} y2={height - 42} stroke="rgba(255,255,255,0.20)" />
        {values.map((value, index) => {
          const groupX = left + index * groupWidth;
          const codewordHeight = (value.totalCodewords / yMax) * usableHeight;
          const errorHeight = (value.totalErrors / yMax) * usableHeight;
          const codewordX = groupX + (groupWidth / 2) - barWidth - 3;
          const errorX = groupX + (groupWidth / 2) + 3;

          return (
            <g key={`channel-${value.channelId}`}>
              <rect
                x={codewordX}
                y={top + usableHeight - codewordHeight}
                width={barWidth}
                height={Math.max(codewordHeight, 1)}
                rx="3"
                fill="rgba(121, 169, 255, 0.55)"
                stroke="rgba(121, 169, 255, 0.95)"
                strokeWidth="1"
              />
              <rect
                x={errorX}
                y={top + usableHeight - errorHeight}
                width={barWidth}
                height={Math.max(errorHeight, 1)}
                rx="3"
                fill="rgba(255, 111, 145, 0.55)"
                stroke="rgba(255, 111, 145, 0.95)"
                strokeWidth="1"
              />
              <text x={groupX + groupWidth / 2} y={height - 18} fill="#9eb0c9" fontSize="11" textAnchor="middle">
                {value.channelId}
              </text>
            </g>
          );
        })}
        <text x={width / 2 - 28} y={height - 2} fill="#9eb0c9" fontSize="11">
          Channel ID
        </text>
        <text x="10" y="14" fill="#9eb0c9" fontSize="11">
          Count
        </text>
      </svg>
    </div>
  );
}
