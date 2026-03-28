import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";

interface DsOfdmActiveWindowDatum {
  label: string;
  zeroMhz: number;
  startMhz: number;
  endMhz: number;
  plcMhz: number;
  isPrimary?: boolean;
  isBackupPrimary?: boolean;
}

interface DsOfdmActiveWindowChartProps {
  title: string;
  subtitle?: string;
  values: DsOfdmActiveWindowDatum[];
  exportBaseName?: string;
}

export function DsOfdmActiveWindowChart({ title, subtitle, values, exportBaseName }: DsOfdmActiveWindowChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  if (!values.length) {
    return <p className="panel-copy">No OFDM active window data available.</p>;
  }

  const width = 1440;
  const height = Math.max(180, 84 + values.length * 34);
  const left = 88;
  const top = 20;
  const usableWidth = width - 132;
  const rowHeight = 28;
  const minX = Math.min(...values.flatMap((value) => [value.zeroMhz, value.startMhz, value.plcMhz]));
  const maxX = Math.max(...values.flatMap((value) => [value.endMhz, value.plcMhz]));
  const scale = (value: number) => left + ((value - minX) / (maxX - minX || 1)) * usableWidth;
  const boundaryStroke = "rgba(110, 231, 255, 0.98)";

  return (
    <div className="chart-frame">
      <div className="chart-header">
        <div>
          <div className="chart-title">{title}</div>
          {subtitle ? <div className="chart-meta">{subtitle}</div> : null}
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
      <svg ref={svgRef} className="chart-svg-short" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
        {values.map((value, index) => {
          const y = top + index * rowHeight + 8;
          const zeroX = scale(value.zeroMhz);
          const startX = scale(value.startMhz);
          const endX = scale(value.endMhz);
          const plcX = scale(value.plcMhz);
          const rangeStroke = value.isPrimary
            ? "rgba(91, 211, 159, 0.98)"
            : value.isBackupPrimary
              ? "rgba(121,169,255,0.95)"
              : "rgba(121,169,255,0.95)";
          const rangeFill = value.isPrimary
            ? "rgba(91, 211, 159, 0.40)"
            : value.isBackupPrimary
              ? "rgba(121,169,255,0.45)"
              : "rgba(121,169,255,0.45)";
          return (
            <g key={value.label}>
              <text x="10" y={y + 12} fill="#9eb0c9" fontSize="11">{value.label}</text>
              <rect x={left} y={y} width={usableWidth} height="16" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
              <rect x={startX} y={y} width={Math.max(endX - startX, 4)} height="16" rx="8" fill={rangeFill} stroke={rangeStroke} />
              <line x1={zeroX} y1={y - 4} x2={zeroX} y2={y + 20} stroke="rgba(255, 214, 10, 0.95)" strokeWidth="1.5" strokeDasharray="3 2" />
              <line x1={startX} y1={y - 4} x2={startX} y2={y + 20} stroke={boundaryStroke} strokeWidth="1.5" />
              <line x1={endX} y1={y - 4} x2={endX} y2={y + 20} stroke={boundaryStroke} strokeWidth="1.5" />
              <line x1={plcX} y1={y - 4} x2={plcX} y2={y + 20} stroke="rgba(255, 107, 107, 0.98)" strokeWidth="1.5" />
            </g>
          );
        })}
        <text x={left} y={height - 8} fill="#9eb0c9" fontSize="11">{minX.toFixed(3)} MHz</text>
        <text x={width - 92} y={height - 8} fill="#9eb0c9" fontSize="11">{maxX.toFixed(3)} MHz</text>
        <g transform={`translate(${width - 220}, ${height - 36})`}>
          <rect x="0" y="-18" width="214" height="28" rx="8" fill="rgba(10,20,32,0.82)" stroke="rgba(255,255,255,0.08)" />
          <line x1="10" y1="-4" x2="10" y2="8" stroke="rgba(255, 214, 10, 0.95)" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="18" y="5" fill="#9eb0c9" fontSize="10">Zero</text>
          <line x1="58" y1="-4" x2="58" y2="8" stroke={boundaryStroke} strokeWidth="1.5" />
          <text x="66" y="5" fill="#9eb0c9" fontSize="10">Start/End</text>
          <line x1="128" y1="-4" x2="128" y2="8" stroke="rgba(91, 211, 159, 0.98)" strokeWidth="1.5" />
          <text x="136" y="5" fill="#9eb0c9" fontSize="10">Primary</text>
          <line x1="184" y1="-4" x2="184" y2="8" stroke="rgba(255, 107, 107, 0.98)" strokeWidth="1.5" />
          <text x="192" y="5" fill="#9eb0c9" fontSize="10">PLC</text>
        </g>
      </svg>
    </div>
  );
}
