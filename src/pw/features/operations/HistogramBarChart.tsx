import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";

interface HistogramBarChartProps {
  title: string;
  values: number[];
  exportBaseName?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xTickLabels?: Array<string | number>;
  showAllXTickLabels?: boolean;
}

export function HistogramBarChart({
  title,
  values,
  exportBaseName,
  xAxisLabel = "Bin Index",
  yAxisLabel = "Hit Count",
  xTickLabels,
  showAllXTickLabels = false,
}: HistogramBarChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  if (!values.length) {
    return <p className="panel-copy">No histogram bins available.</p>;
  }

  const width = 1100;
  const height = 360;
  const left = 46;
  const top = 20;
  const bottom = 68;
  const usableWidth = width - 68;
  const usableHeight = height - top - bottom;
  const yMax = Math.max(...values, 1);
  const barWidth = usableWidth / values.length;
  const tickCount = Math.min(10, values.length);
  const centerIndex = Math.floor((values.length - 1) / 2);
  const tickIndexes = showAllXTickLabels
    ? new Set<number>(Array.from({ length: values.length }, (_, index) => index))
    : new Set<number>(
      Array.from({ length: tickCount }, (_, index) => Math.round((index * Math.max(values.length - 1, 0)) / Math.max(tickCount - 1, 1))),
    );
  if (!showAllXTickLabels) {
    tickIndexes.add(centerIndex);
  }

  return (
    <div className="chart-frame">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        {exportBaseName ? (
          <ExportActions
            onPng={() => {
              if (!svgRef.current) return;
              return downloadSvgAsPng(exportBaseName, svgRef.current);
            }}
            onCsv={() => downloadCsv(exportBaseName, values.map((value, index) => ({ bin_index: index, hit_count: value })))}
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
              <text x="8" y={y + 4} fill="#9eb0c9" fontSize="11">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        <line x1={left} y1={height - bottom} x2={width - 20} y2={height - bottom} stroke="rgba(255,255,255,0.20)" />
        <line x1={left} y1={top} x2={left} y2={height - bottom} stroke="rgba(255,255,255,0.20)" />
        {values.map((value, index) => {
          const x = left + index * barWidth + 1;
          const labelX = x + Math.max(barWidth - 2, 1) / 2;
          const barHeight = (value / yMax) * usableHeight;
          return (
            <g key={`bar-${index}`}>
              <rect x={x} y={top + usableHeight - barHeight} width={Math.max(barWidth - 2, 1)} height={barHeight} fill="rgba(0, 194, 255, 0.45)" stroke="rgba(0, 194, 255, 0.95)" strokeWidth="1" />
              {tickIndexes.has(index) ? (
                <text
                  x={labelX}
                  y={height - bottom + 22}
                  fill="#9eb0c9"
                  fontSize="10"
                  textAnchor="end"
                  transform={`rotate(-35 ${labelX} ${height - bottom + 22})`}
                >
                  {xTickLabels?.[index] ?? index}
                </text>
              ) : null}
            </g>
          );
        })}
        <text x={width / 2 - 22} y={height - 8} fill="#9eb0c9" fontSize="11">
          {xAxisLabel}
        </text>
        <text x="10" y="12" fill="#9eb0c9" fontSize="11">
          {yAxisLabel}
        </text>
      </svg>
    </div>
  );
}
