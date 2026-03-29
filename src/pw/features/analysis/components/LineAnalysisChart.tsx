import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { SeriesVisibilityChips } from "@/components/common/SeriesVisibilityChips";
import type { ChartPoint, ChartSeries } from "@/pw/features/analysis/types";
import { downloadCsv, seriesToCsvRows } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";

interface LineAnalysisChartProps {
  title: string;
  subtitle: string;
  yLabel: string;
  series: ChartSeries[];
  showLegend?: boolean;
  yPadding?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  enableRangeSelection?: boolean;
  selection?: SpectrumSelectionRange | null;
  onSelectionChange?: (selection: SpectrumSelectionRange | null) => void;
  exportBaseName?: string;
  selectionActions?: ReactNode;
}

function axisLabels(minValue: number, maxValue: number, count: number): number[] {
  const labels: number[] = [];
  const span = maxValue - minValue || 1;

  for (let index = 0; index <= count; index += 1) {
    labels.push(minValue + (span * index) / count);
  }

  return labels;
}

function buildPath(
  points: ChartPoint[],
  width: number,
  height: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): string {
  const usableWidth = width - 90;
  const usableHeight = height - 44;
  const left = 70;
  const top = 16;

  return points
    .map((point: ChartPoint, index: number) => {
      const x = left + ((point.x - xMin) / (xMax - xMin || 1)) * usableWidth;
      const y = top + usableHeight - ((point.y - yMin) / (yMax - yMin || 1)) * usableHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function LineAnalysisChart({
  title,
  subtitle,
  yLabel,
  series,
  showLegend = true,
  yPadding = 0.35,
  xDomain,
  yDomain,
  enableRangeSelection = false,
  selection = null,
  onSelectionChange,
  exportBaseName,
  selectionActions,
}: LineAnalysisChartProps) {
  const width = 1100;
  const height = 320;
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({});
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    setSeriesVisibility((current) => {
      const next: Record<string, boolean> = {};
      let changed = false;

      for (const item of series) {
        next[item.label] = current[item.label] ?? true;
        if (next[item.label] !== current[item.label]) {
          changed = true;
        }
      }

      if (Object.keys(current).length !== Object.keys(next).length) {
        changed = true;
      }

      return changed ? next : current;
    });
  }, [series]);
  const normalizedSelection = useMemo(() => {
    if (!selection) return null;
    return {
      startX: Math.min(selection.startX, selection.endX),
      endX: Math.max(selection.startX, selection.endX),
    };
  }, [selection]);
  const visibleSeries = series.filter((item) => seriesVisibility[item.label] !== false);
  const allPoints = visibleSeries.flatMap((item) => item.points);
  const hasSeriesData = series.some((item) => item.points.length > 0);

  if (!hasSeriesData) {
    return (
      <div className="chart-frame">
        <div className="chart-header">
          <div>
            <div className="chart-title">{title}</div>
            <div className="chart-meta">{subtitle}</div>
          </div>
        </div>
        <div className="panel-copy">No chart data available.</div>
      </div>
    );
  }
  const domainPoints = allPoints.length ? allPoints : series.flatMap((item) => item.points);
  const xValues = domainPoints.map((point) => point.x);
  const yValues = domainPoints.map((point) => point.y);
  const xMin = xDomain?.[0] ?? Math.min(...xValues);
  const xMax = xDomain?.[1] ?? Math.max(...xValues);
  const yMin = yDomain?.[0] ?? (Math.min(...yValues) - yPadding);
  const yMax = yDomain?.[1] ?? (Math.max(...yValues) + yPadding);
  const yTicks = axisLabels(yMin, yMax, 4);
  const xTicks = axisLabels(xMin, xMax, 6);
  const usableWidth = width - 90;
  const left = 70;

  function eventToDataX(clientX: number, svg: SVGSVGElement): number {
    const rect = svg.getBoundingClientRect();
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    const viewBoxX = Math.min(Math.max(ratio * width, left), width - 20);
    return xMin + ((viewBoxX - left) / (usableWidth || 1)) * (xMax - xMin || 1);
  }

  const canMuteSeries = showLegend && series.length > 1;

  return (
    <div className="chart-frame">
      <div className="chart-header">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-meta">{subtitle}</div>
        </div>
        <div className="chart-header-actions">
          {selectionActions}
          {canMuteSeries ? (
            <SeriesVisibilityChips
              series={series}
              visibility={seriesVisibility}
              onToggle={(label) => {
                setSeriesVisibility((current) => ({
                  ...current,
                  [label]: current[label] === false,
                }));
              }}
            />
          ) : showLegend ? (
            <div className="status-chip-row">
              {visibleSeries.map((item) => (
                <span key={item.label} className="analysis-chip">
                  <span className="analysis-swatch" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          ) : null}
          {exportBaseName ? (
            <ExportActions
              onPng={() => {
                if (!svgRef.current) {
                  return;
                }
                return downloadSvgAsPng(exportBaseName, svgRef.current);
              }}
              onCsv={() => downloadCsv(exportBaseName, seriesToCsvRows(visibleSeries), ["x", ...visibleSeries.map((item) => item.label)])}
            />
          ) : null}
        </div>
      </div>
      <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
        {normalizedSelection ? (
          <rect
            x={left + ((normalizedSelection.startX - xMin) / (xMax - xMin || 1)) * usableWidth}
            y="16"
            width={Math.max(((normalizedSelection.endX - normalizedSelection.startX) / (xMax - xMin || 1)) * usableWidth, 0)}
            height={height - 48}
            fill="rgba(121, 169, 255, 0.10)"
            stroke="rgba(121, 169, 255, 0.38)"
            strokeWidth="1"
          />
        ) : null}
        {yTicks.map((value) => {
          const y = 16 + (height - 48) - ((value - yMin) / (yMax - yMin || 1)) * (height - 48);
          return (
            <g key={`y-${value}`}>
              <line x1={left} y1={y} x2={width - 20} y2={y} stroke="rgba(255,255,255,0.10)" />
              <text x={left - 6} y={y + 4} fill="#9eb0c9" fontSize="11" textAnchor="end">
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}
        {xTicks.map((value) => {
          const x = left + ((value - xMin) / (xMax - xMin || 1)) * usableWidth;
          return (
            <g key={`x-${value}`}>
              <line x1={x} y1="16" x2={x} y2={height - 32} stroke="rgba(255,255,255,0.07)" />
              <text x={x} y={height - 13} fill="#9eb0c9" fontSize="11" textAnchor="middle">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        <line x1={left} y1={height - 32} x2={width - 20} y2={height - 32} stroke="rgba(255,255,255,0.20)" />
        <line x1={left} y1="16" x2={left} y2={height - 32} stroke="rgba(255,255,255,0.20)" />
        {visibleSeries.map((item) => (
          <path
            key={item.label}
            d={buildPath(item.points, width, height, xMin, xMax, yMin, yMax)}
            fill="none"
            stroke={item.color}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        <text x={width / 2 - 18} y={height - 1} fill="#9eb0c9" fontSize="11">
          MHz
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
          {yLabel}
        </text>
        {enableRangeSelection ? (
          <rect
            x={left}
            y="16"
            width={usableWidth}
            height={height - 48}
            fill="transparent"
            style={{ cursor: "crosshair" }}
            onMouseDown={(event) => {
              const svg = event.currentTarget.ownerSVGElement;
              if (!svg) return;
              const dataX = eventToDataX(event.clientX, svg);
              setDragStartX(dataX);
              onSelectionChange?.({ startX: dataX, endX: dataX });
            }}
            onMouseMove={(event) => {
              if (dragStartX === null) return;
              const svg = event.currentTarget.ownerSVGElement;
              if (!svg) return;
              const dataX = eventToDataX(event.clientX, svg);
              onSelectionChange?.({ startX: dragStartX, endX: dataX });
            }}
            onMouseUp={() => {
              setDragStartX(null);
            }}
            onMouseLeave={() => {
              setDragStartX(null);
            }}
            onDoubleClick={() => {
              setDragStartX(null);
              onSelectionChange?.(null);
            }}
          />
        ) : null}
      </svg>
    </div>
  );
}
