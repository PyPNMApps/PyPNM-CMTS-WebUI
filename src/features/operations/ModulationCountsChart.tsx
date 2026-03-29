import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";

interface ModulationCountsChartProps {
  title: string;
  counts: Record<string, number> | undefined;
  exportBaseName?: string;
}

interface ModulationEntry {
  key: string;
  label: string;
  bits: number | null;
  value: number;
  order: number;
}

function toEntries(counts: Record<string, number> | undefined): ModulationEntry[] {
  if (!counts) {
    return [];
  }

  return Object.keys(counts)
    .map((key) => {
      const match = /^qam[_-]?(\d+)$/i.exec(String(key));
      const qamOrder = match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
      const bits = match && qamOrder > 0 ? Math.round(Math.log2(qamOrder)) : null;

      return {
        key,
        label: match ? `QAM ${match[1]}` : key,
        bits,
        order: qamOrder,
        value: Number(counts[key] ?? 0),
      };
    })
    .sort((left, right) => {
      if (left.order !== right.order) {
        return left.order - right.order;
      }
      return left.key.localeCompare(right.key);
    });
}

export function ModulationCountsChart({ title, counts, exportBaseName }: ModulationCountsChartProps) {
  const entries = toEntries(counts);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!entries.length) {
    return null;
  }

  const width = 1100;
  const height = 340;
  const left = 72;
  const right = 20;
  const top = 16;
  const bottom = 72;
  const usableWidth = width - left - right;
  const usableHeight = height - top - bottom;
  const maxValue = Math.max(...entries.map((entry) => entry.value), 1);
  const yMax = Math.ceil(maxValue / 100) * 100 || maxValue;
  const yTicks = 4;
  const points = entries.map((entry, index) => {
    const x = left + (usableWidth / Math.max(entries.length, 1)) * (index + 0.5);
    const y = top + usableHeight - (entry.value / yMax) * usableHeight;
    return { x, y, entry };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

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
            onCsv={() => downloadCsv(
              exportBaseName,
              entries.map((entry) => ({
                key: entry.key,
                label: entry.label,
                qam_order: entry.order,
                bits_per_symbol: entry.bits ?? "n/a",
                carrier_count: entry.value,
              })),
            )}
          />
        ) : null}
      </div>
      <svg ref={svgRef} className="chart-svg chart-svg-short" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
        {Array.from({ length: yTicks + 1 }, (_, index) => {
          const value = (yMax / yTicks) * index;
          const y = top + usableHeight - (value / yMax) * usableHeight;
          return (
            <g key={`y-${value}`}>
              <line x1={left} y1={y} x2={width - right} y2={y} stroke="rgba(255,255,255,0.10)" />
              <text x={left - 8} y={y + 4} fill="#9eb0c9" fontSize="11" textAnchor="end">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="rgba(255,255,255,0.20)" />
        <line x1={left} y1={top} x2={left} y2={height - bottom} stroke="rgba(255,255,255,0.20)" />

        <path d={path} fill="none" stroke="#58d0a7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point) => (
          <g key={point.entry.key}>
            <circle cx={point.x} cy={point.y} r="2.2" fill="#58d0a7" />
            <text
              x={point.x}
              y={height - bottom + 26}
              fill="#9eb0c9"
              fontSize="10"
              textAnchor="end"
              transform={`rotate(-35 ${point.x} ${height - bottom + 26})`}
            >
              {point.entry.label}
            </text>
          </g>
        ))}

        <text x={width / 2} y={height - 8} fill="#9eb0c9" fontSize="11" textAnchor="middle">
          Modulation (QAM / bit-sym)
        </text>
        <text
          x="18"
          y={height / 2}
          fill="#9eb0c9"
          fontSize="11"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(-90 18 ${height / 2})`}
        >
          Carrier Count
        </text>
      </svg>
    </div>
  );
}
