import { useMemo, useRef, useState } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";

interface If31DsOfdmProfileStatsChartDatum {
  label: string;
  total: number;
  corrected: number;
  uncorrectable?: number;
  inOctets?: number;
  unicastOctets?: number;
  multicastOctets?: number;
}

interface If31DsOfdmProfileStatsChartProps {
  title: string;
  subtitle: string;
  values: If31DsOfdmProfileStatsChartDatum[];
  mode: "codewords" | "octets" | "traffic";
  exportBaseName?: string;
}

function formatSi(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}G`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  return Math.round(value).toLocaleString("en-US");
}

export function If31DsOfdmProfileStatsChart({
  title,
  subtitle,
  values,
  mode,
  exportBaseName,
}: If31DsOfdmProfileStatsChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 1100;
  const height = 340;
  const left = 58;
  const top = 24;
  const bottom = 58;
  const right = 20;
  const usableWidth = width - left - right;
  const usableHeight = height - top - bottom;
  const series = useMemo(
    () =>
      mode === "codewords"
        ? [
            { key: "total", label: "Total", color: "#79a9ff" },
            { key: "corrected", label: "Corrected", color: "#58d0a7" },
            { key: "uncorrectable", label: "Uncorrectable", color: "#ff6f91" },
          ]
        : mode === "octets"
          ? [
              { key: "inOctets", label: "In Octets", color: "#79a9ff" },
              { key: "unicastOctets", label: "Unicast Octets", color: "#58d0a7" },
              { key: "multicastOctets", label: "Multicast Octets", color: "#f1c40f" },
            ]
          : [
              { key: "unicastOctets", label: "Unicast Octets", color: "#58d0a7" },
              { key: "multicastOctets", label: "Multicast Octets", color: "#f1c40f" },
            ],
    [mode],
  );
  const defaultVisibleSeries = useMemo(() => series.map((seriesItem) => seriesItem.key), [series]);
  const [visibleSeriesKeys, setVisibleSeriesKeys] = useState<string[]>(defaultVisibleSeries);
  const visibleSeries = series.filter((seriesItem) => visibleSeriesKeys.includes(seriesItem.key));
  if (!values.length) {
    return <p className="panel-copy">No OFDM profile stats data available.</p>;
  }
  const yMax = Math.max(
    1,
    ...values.flatMap((value) =>
      visibleSeries.map((seriesItem) => Number(value[seriesItem.key as keyof If31DsOfdmProfileStatsChartDatum] ?? 0)),
    ),
  );
  const groupWidth = usableWidth / values.length;
  const seriesCount = Math.max(visibleSeries.length, 1);
  const barWidth = Math.max(8, Math.min(24, (groupWidth - 14) / Math.max(seriesCount, 1)));

  return (
    <div className="chart-frame">
      <div className="chart-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-meta">{subtitle}</div>
        </div>
        <div className="status-chip-row profile-stats-chart-controls">
          {series.map((seriesItem) => (
            <button
              key={seriesItem.key}
              type="button"
              className={visibleSeriesKeys.includes(seriesItem.key) ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
              aria-pressed={visibleSeriesKeys.includes(seriesItem.key)}
              onClick={() => {
                setVisibleSeriesKeys((current) => {
                  if (current.includes(seriesItem.key)) {
                    return current.length === 1 ? current : current.filter((entry) => entry !== seriesItem.key);
                  }
                  return [...current, seriesItem.key];
                });
              }}
            >
              <span className="analysis-swatch" style={{ backgroundColor: seriesItem.color }} />
              {seriesItem.label}
            </button>
          ))}
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
              <line x1={left} y1={y} x2={width - right} y2={y} stroke="rgba(255,255,255,0.10)" />
              <text x="10" y={y + 4} fill="#9eb0c9" fontSize="11">
                {formatSi(value)}
              </text>
            </g>
          );
        })}
        <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="rgba(255,255,255,0.20)" />
        <line x1={left} y1={top} x2={left} y2={height - bottom} stroke="rgba(255,255,255,0.20)" />
        {values.map((value, index) => {
          const groupX = left + index * groupWidth;
          const clusterWidth = seriesCount * barWidth + (seriesCount - 1) * 4;
          const startX = groupX + (groupWidth - clusterWidth) / 2;

          return (
            <g key={`profile-${value.label}`}>
              {visibleSeries.map((seriesItem, seriesIndex) => {
                const raw = Number(value[seriesItem.key as keyof If31DsOfdmProfileStatsChartDatum] ?? 0);
                const barHeight = (raw / yMax) * usableHeight;
                return (
                  <rect
                    key={`${value.label}-${seriesItem.key}`}
                    x={startX + seriesIndex * (barWidth + 4)}
                    y={top + usableHeight - barHeight}
                    width={barWidth}
                    height={Math.max(barHeight, 1)}
                    rx="3"
                    fill={seriesItem.color}
                    fillOpacity="0.55"
                    stroke={seriesItem.color}
                    strokeWidth="1"
                  />
                );
              })}
              <text x={groupX + groupWidth / 2} y={height - 18} fill="#9eb0c9" fontSize="11" textAnchor="middle">
                {value.label}
              </text>
            </g>
          );
        })}
        <text x={width / 2 - 18} y={height - 2} fill="#9eb0c9" fontSize="11">
          Profile
        </text>
        <text x="10" y="14" fill="#9eb0c9" fontSize="11">
          Count
        </text>
      </svg>
    </div>
  );
}
