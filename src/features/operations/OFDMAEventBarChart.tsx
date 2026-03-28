import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";

interface OFDMAEventBarChartProps {
  title: string;
  t3: number;
  t4: number;
  abort: number;
  exceed: number;
  exportBaseName?: string;
}

export function OFDMAEventBarChart({ title, t3, t4, abort, exceed, exportBaseName }: OFDMAEventBarChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const values = [
    { label: "T3", value: t3 },
    { label: "T4", value: t4 },
    { label: "Abort", value: abort },
    { label: "Exceed", value: exceed },
  ];
  const width = 520;
  const height = 220;
  const left = 46;
  const top = 18;
  const usableWidth = width - 68;
  const usableHeight = height - 56;
  const yMax = Math.max(1, ...values.map((item) => item.value));
  const barWidth = usableWidth / values.length;

  return (
    <div className="chart-frame chart-frame-compact">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        {exportBaseName ? (
          <ExportActions
            onPng={() => {
              if (!svgRef.current) return;
              return downloadSvgAsPng(exportBaseName, svgRef.current);
            }}
            onCsv={() => downloadCsv(exportBaseName, values.map((item) => ({ event: item.label, count: item.value })))}
          />
        ) : null}
      </div>
      <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
        {Array.from({ length: 5 }, (_, index) => {
          const value = (yMax / 4) * index;
          const y = top + usableHeight - (value / yMax) * usableHeight;
          return (
            <g key={`tick-${value}`}>
              <line x1={left} y1={y} x2={width - 20} y2={y} stroke="rgba(255,255,255,0.10)" />
              <text x="10" y={y + 4} fill="#9eb0c9" fontSize="11">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        {values.map((item, index) => {
          const x = left + index * barWidth + 10;
          const h = (item.value / yMax) * usableHeight;
          return (
            <g key={item.label}>
              <rect x={x} y={top + usableHeight - h} width={Math.max(barWidth - 20, 10)} height={Math.max(h, 1)} rx="6" fill="rgba(255, 111, 145, 0.55)" stroke="rgba(255, 111, 145, 0.95)" />
              <text x={x + Math.max(barWidth - 20, 10) / 2} y={height - 16} fill="#9eb0c9" fontSize="11" textAnchor="middle">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
