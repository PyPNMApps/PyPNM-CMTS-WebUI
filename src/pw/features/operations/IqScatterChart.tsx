import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";

interface IqScatterChartProps {
  title: string;
  points: Array<[number, number]>;
  exportBaseName?: string;
}

export function IqScatterChart({ title, points, exportBaseName }: IqScatterChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  if (!points.length) {
    return null;
  }

  const width = 360;
  const height = 360;
  const padding = 28;
  const allI = points.map((point) => point[0]);
  const allQ = points.map((point) => point[1]);
  const iMin = Math.min(...allI);
  const iMax = Math.max(...allI);
  const qMin = Math.min(...allQ);
  const qMax = Math.max(...allQ);

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
            onCsv={() => downloadCsv(exportBaseName, points.map((point, index) => ({ point_index: index + 1, i: point[0], q: point[1] })))}
          />
        ) : null}
      </div>
      <svg ref={svgRef} className="chart-svg chart-svg-square" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={title}>
        <rect x={padding} y={padding} width={width - padding * 2} height={height - padding * 2} fill="rgba(255,255,255,0.02)" />
        <line x1={width / 2} y1={padding} x2={width / 2} y2={height - padding} stroke="rgba(255,255,255,0.12)" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.12)" />
        {points.map((point, index) => {
          const x = padding + ((point[0] - iMin) / (iMax - iMin || 1)) * (width - padding * 2);
          const y = padding + (height - padding * 2) - ((point[1] - qMin) / (qMax - qMin || 1)) * (height - padding * 2);
          return <circle key={`${point[0]}-${point[1]}-${index}`} cx={x} cy={y} r="2.4" fill="#79a9ff" opacity="0.85" />;
        })}
        <text x={width / 2 - 5} y={height - 6} fill="#9eb0c9" fontSize="11">
          I
        </text>
        <text x="10" y={height / 2} fill="#9eb0c9" fontSize="11">
          Q
        </text>
      </svg>
    </div>
  );
}
