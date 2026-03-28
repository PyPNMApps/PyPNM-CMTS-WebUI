import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";

interface DsOfdmReliabilityChartProps {
  title: string;
  plcTotalCw: number;
  plcUnreliableCw: number;
  ncpTotalFields: number;
  ncpCrcFailures: number;
  exportBaseName?: string;
}

function formatSi(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}G`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  return Math.round(value).toLocaleString("en-US");
}

export function DsOfdmReliabilityChart({
  title,
  plcTotalCw,
  plcUnreliableCw,
  ncpTotalFields,
  ncpCrcFailures,
  exportBaseName,
}: DsOfdmReliabilityChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 520;
  const height = 220;
  const left = 42;
  const top = 18;
  const bottom = 42;
  const usableWidth = width - 60;
  const usableHeight = height - top - bottom;
  const yMax = Math.max(1, plcTotalCw, plcUnreliableCw, ncpTotalFields, ncpCrcFailures);
  const laneWidth = usableWidth / 2;
  const laneGap = 20;
  const barWidth = Math.max(20, Math.min(40, (laneWidth - laneGap) / 2));

  return (
    <div className="chart-frame chart-frame-compact">
      <div className="chart-header">
        <div>
          <div className="chart-title">{title}</div>
        </div>
        <div className="status-chip-row">
          <span className="analysis-chip">
            <span className="analysis-swatch" style={{ backgroundColor: "#79a9ff" }} />
            Total
          </span>
          <span className="analysis-chip">
            <span className="analysis-swatch" style={{ backgroundColor: "#ff6f91" }} />
            Errors
          </span>
        </div>
        {exportBaseName ? (
          <ExportActions
            onPng={() => {
              if (!svgRef.current) return;
              return downloadSvgAsPng(exportBaseName, svgRef.current);
            }}
            onCsv={() => downloadCsv(exportBaseName, [
              { metric: "plc_total_codewords", value: plcTotalCw },
              { metric: "plc_unreliable_codewords", value: plcUnreliableCw },
              { metric: "ncp_total_fields", value: ncpTotalFields },
              { metric: "ncp_crc_failures", value: ncpCrcFailures },
            ])}
          />
        ) : null}
      </div>
      <svg ref={svgRef} className="chart-svg-short" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
        {Array.from({ length: 5 }, (_, index) => {
          const value = (yMax / 4) * index;
          const y = top + usableHeight - (value / yMax) * usableHeight;
          return (
            <g key={`y-${value}`}>
              <line x1={left} y1={y} x2={width - 20} y2={y} stroke="rgba(255,255,255,0.10)" />
              <text x="8" y={y + 4} fill="#9eb0c9" fontSize="10">{formatSi(value)}</text>
            </g>
          );
        })}
        <line x1={left} y1={height - bottom} x2={width - 20} y2={height - bottom} stroke="rgba(255,255,255,0.20)" />
        <line x1={left + laneWidth} y1={top} x2={left + laneWidth} y2={height - bottom} stroke="rgba(255,255,255,0.10)" strokeDasharray="4 4" />
        {[
          { laneLabel: "PLC Codewords", total: plcTotalCw, errors: plcUnreliableCw, x: left + laneWidth / 2 },
          { laneLabel: "NCP Fields", total: ncpTotalFields, errors: ncpCrcFailures, x: left + laneWidth + laneWidth / 2 },
        ].map((lane) => {
          const totalHeight = (lane.total / yMax) * usableHeight;
          const errorHeight = (lane.errors / yMax) * usableHeight;
          return (
            <g key={lane.laneLabel}>
              <rect
                x={lane.x - barWidth - 6}
                y={top + usableHeight - totalHeight}
                width={barWidth}
                height={Math.max(totalHeight, 1)}
                rx="3"
                fill="rgba(121,169,255,0.55)"
                stroke="rgba(121,169,255,0.95)"
              />
              <rect
                x={lane.x + 6}
                y={top + usableHeight - errorHeight}
                width={barWidth}
                height={Math.max(errorHeight, 1)}
                rx="3"
                fill="rgba(255,111,145,0.55)"
                stroke="rgba(255,111,145,0.95)"
              />
              <text x={lane.x} y={height - 16} fill="#9eb0c9" fontSize="11" textAnchor="middle">
                {lane.laneLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
