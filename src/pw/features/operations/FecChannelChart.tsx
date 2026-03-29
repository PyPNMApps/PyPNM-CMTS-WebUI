import { useEffect, useMemo, useRef, useState } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import type { SingleFecSummaryProfileEntry } from "@/types/api";

interface FecChannelChartProps {
  title: string;
  profiles: SingleFecSummaryProfileEntry[];
  exportBaseName?: string;
}

const totalPalette = ["#79a9ff", "#4f7cff", "#9bbcff", "#3f68d8"] as const;
const TOTAL_CW_COLOR = "#4f90ff";
const CORRECTED_CW_COLOR = "#2ecc71";
const UNCORRECTED_CW_COLOR = "#ff4d4f";

function formatSi(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}G`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

function normalizeDomain(domain: [number, number]): [number, number] {
  return domain[0] <= domain[1] ? domain : [domain[1], domain[0]];
}

function valuesInDomain(values: number[], timestamps: number[], domain: [number, number]): number[] {
  const [minX, maxX] = normalizeDomain(domain);
  const output: number[] = [];
  for (let index = 0; index < Math.min(values.length, timestamps.length); index += 1) {
    const timestamp = timestamps[index];
    const value = values[index];
    if (timestamp >= minX && timestamp <= maxX && Number.isFinite(value)) {
      output.push(value);
    }
  }
  return output;
}

function entriesInDomain(
  timestamps: number[],
  totalCodewords: number[],
  corrected: number[],
  uncorrected: number[],
  domain: [number, number],
) {
  const [minX, maxX] = normalizeDomain(domain);
  const output: Array<{ timestamp: number; total: number; corrected: number; uncorrected: number }> = [];
  const count = Math.min(timestamps.length, totalCodewords.length, corrected.length, uncorrected.length);
  for (let index = 0; index < count; index += 1) {
    const timestamp = timestamps[index];
    const total = totalCodewords[index];
    const correctedValue = corrected[index];
    const uncorrectedValue = uncorrected[index];
    if (
      !Number.isFinite(timestamp)
      || !Number.isFinite(total)
      || !Number.isFinite(correctedValue)
      || !Number.isFinite(uncorrectedValue)
    ) {
      continue;
    }
    if (timestamp < minX || timestamp > maxX) {
      continue;
    }
    output.push({ timestamp, total, corrected: correctedValue, uncorrected: uncorrectedValue });
  }
  return output;
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

function buildPath(
  values: number[],
  timestamps: number[],
  maxValue: number,
  xMin: number,
  xMax: number,
  left: number,
  top: number,
  usableWidth: number,
  usableHeight: number,
): string {
  const points: string[] = [];
  for (let index = 0; index < Math.min(values.length, timestamps.length); index += 1) {
    const timestamp = timestamps[index];
    const value = values[index];
    if (!Number.isFinite(timestamp) || !Number.isFinite(value)) {
      continue;
    }
    if (timestamp < xMin || timestamp > xMax) {
      continue;
    }
    const x = left + ((timestamp - xMin) / (xMax - xMin || 1)) * usableWidth;
    const y = top + usableHeight - (value / (maxValue || 1)) * usableHeight;
    points.push(`${points.length === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join(" ");
}

export function FecChannelChart({ title, profiles, exportBaseName }: FecChannelChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const defaultProfileKey = useMemo(() => {
    const profileZero = profiles.find((profile) => String(profile.profile) === "0");
    return String((profileZero ?? profiles[0])?.profile ?? "");
  }, [profiles]);
  const [visibleProfileKeys, setVisibleProfileKeys] = useState<string[]>(defaultProfileKey ? [defaultProfileKey] : []);
  const [visibleMetricKeys, setVisibleMetricKeys] = useState<string[]>(["total", "corrected", "uncorrected"]);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [selection, setSelection] = useState<[number, number] | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const visibleProfiles = profiles.filter((profile) => visibleProfileKeys.includes(String(profile.profile)));
  const timestamps = useMemo(
    () => visibleProfiles[0]?.codewords.timestamps ?? profiles[0]?.codewords.timestamps ?? [],
    [profiles, visibleProfiles],
  );
  const width = 980;
  const height = 320;
  const left = 52;
  const top = 16;
  const usableWidth = width - 76;
  const axisBottom = height - 56;
  const usableHeight = axisBottom - top;
  const baseXMin = timestamps.length ? Math.min(...timestamps) : 0;
  const baseXMax = timestamps.length ? Math.max(...timestamps) : 1;
  const activeZoomDomain = zoomDomain ?? [baseXMin, baseXMax];
  const [xMin, xMax] = normalizeDomain(activeZoomDomain);
  const visibleTimestamps = timestamps.filter((timestamp) => timestamp >= xMin && timestamp <= xMax);
  const totalWindowValues = visibleProfiles.flatMap((profile) =>
    valuesInDomain(profile.codewords.total_codewords, profile.codewords.timestamps, [xMin, xMax]),
  );
  const errorWindowValues = visibleProfiles.flatMap((profile) => [
    ...valuesInDomain(profile.codewords.corrected, profile.codewords.timestamps, [xMin, xMax]),
    ...valuesInDomain(profile.codewords.uncorrected, profile.codewords.timestamps, [xMin, xMax]),
  ]);
  const totalMax = Math.max(...totalWindowValues, 1);
  const errorMax = Math.max(
    ...errorWindowValues,
    1,
  );
  const tickCount = Math.min(6, visibleTimestamps.length);
  const tickIndexes = new Set(
    Array.from({ length: tickCount }, (_, index) => Math.round((index * Math.max(visibleTimestamps.length - 1, 0)) / Math.max(tickCount - 1, 1))),
  );

  useEffect(() => {
    if (!timestamps.length) {
      setZoomDomain(null);
      setSelection(null);
      return;
    }
    const nextMin = Math.min(...timestamps);
    const nextMax = Math.max(...timestamps);
    if (!zoomDomain) {
      return;
    }
    if (zoomDomain[0] < nextMin || zoomDomain[1] > nextMax) {
      setZoomDomain([nextMin, nextMax]);
    }
  }, [timestamps, zoomDomain]);

  function eventToDataX(clientX: number, svg: SVGSVGElement): number {
    const rect = svg.getBoundingClientRect();
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    const viewBoxX = Math.min(Math.max(ratio * width, left), width - 24);
    return xMin + ((viewBoxX - left) / (usableWidth || 1)) * (xMax - xMin || 1);
  }

  const normalizedSelection = selection ? normalizeDomain(selection) : null;
  const canZoom = Boolean(
    normalizedSelection
    && Math.abs(normalizedSelection[1] - normalizedSelection[0]) > 0,
  );
  const profileTableRows = visibleProfiles.map((profile) => {
    const entries = entriesInDomain(
      profile.codewords.timestamps,
      profile.codewords.total_codewords,
      profile.codewords.corrected,
      profile.codewords.uncorrected,
      [xMin, xMax],
    );
    const firstEntry = entries[0] ?? null;
    const lastEntry = entries[entries.length - 1] ?? null;
    const totalSum = entries.reduce((sum, entry) => sum + entry.total, 0);
    const correctedSum = entries.reduce((sum, entry) => sum + entry.corrected, 0);
    const uncorrectedSum = entries.reduce((sum, entry) => sum + entry.uncorrected, 0);
    return {
      profile: String(profile.profile),
      sampleCount: entries.length,
      windowStartLabel: firstEntry ? formatEpochSecondsUtc(firstEntry.timestamp) : "n/a",
      windowEndLabel: lastEntry ? formatEpochSecondsUtc(lastEntry.timestamp) : "n/a",
      totalLast: lastEntry ? formatCount(lastEntry.total) : "n/a",
      correctedLast: lastEntry ? formatCount(lastEntry.corrected) : "n/a",
      uncorrectedLast: lastEntry ? formatCount(lastEntry.uncorrected) : "n/a",
      totalSum: entries.length ? formatCount(totalSum) : "n/a",
      correctedSum: entries.length ? formatCount(correctedSum) : "n/a",
      uncorrectedSum: entries.length ? formatCount(uncorrectedSum) : "n/a",
    };
  });

  return (
    <div className="chart-frame">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        <div className="chart-header-actions">
          <div className="status-chip-row fec-header-actions">
            <button
              type="button"
              className="analysis-chip-button"
              disabled={!canZoom}
              onClick={() => {
                if (!normalizedSelection) {
                  return;
                }
                setZoomDomain(normalizedSelection);
                setSelection(null);
              }}
            >
              Zoom
            </button>
            <button
              type="button"
              className="analysis-chip-button"
              disabled={!zoomDomain}
              onClick={() => {
                setZoomDomain(null);
                setSelection(null);
              }}
            >
              Reset Zoom
            </button>
          </div>
          {exportBaseName ? (
            <ExportActions
              onPng={() => {
                if (!svgRef.current) return;
                return downloadSvgAsPng(exportBaseName, svgRef.current);
              }}
              onCsv={() => downloadCsv(
                exportBaseName,
                profiles.flatMap((profile) =>
                  profile.codewords.timestamps.map((timestamp, index) => ({
                    profile: profile.profile,
                    timestamp_utc: formatEpochSecondsUtc(timestamp),
                    total_codewords: profile.codewords.total_codewords[index] ?? "n/a",
                    corrected: profile.codewords.corrected[index] ?? "n/a",
                    uncorrected: profile.codewords.uncorrected[index] ?? "n/a",
                  })),
                ),
              )}
            />
          ) : null}
        </div>
      </div>
      <div className="status-chip-row fec-toggle-row">
        {profiles.map((profile, index) => {
          const profileKey = String(profile.profile);
          const isActive = visibleProfileKeys.includes(profileKey);
          return (
            <button
              key={`toggle-${profileKey}`}
              type="button"
              className={isActive ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
              onClick={() => {
                setVisibleProfileKeys((current) => {
                  if (current.includes(profileKey)) {
                    return current.length === 1 ? current : current.filter((entry) => entry !== profileKey);
                  }
                  return [...current, profileKey];
                });
              }}
            >
              <span className="analysis-swatch" style={{ backgroundColor: totalPalette[index % totalPalette.length] }} />
              Profile {profile.profile}
            </button>
          );
        })}
      </div>
      <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
        {normalizedSelection ? (
          <rect
            x={left + ((normalizedSelection[0] - xMin) / (xMax - xMin || 1)) * usableWidth}
            y={top}
            width={Math.max(((normalizedSelection[1] - normalizedSelection[0]) / (xMax - xMin || 1)) * usableWidth, 0)}
            height={usableHeight}
            fill="rgba(121, 169, 255, 0.10)"
            stroke="rgba(121, 169, 255, 0.38)"
            strokeWidth="1"
          />
        ) : null}
        {Array.from({ length: 5 }, (_, index) => {
          const value = (totalMax / 4) * index;
          const y = top + usableHeight - (value / totalMax) * usableHeight;
          return (
            <g key={`total-y-${value}`}>
              <line x1={left} y1={y} x2={width - 24} y2={y} stroke="rgba(255,255,255,0.08)" />
              <text x="8" y={y + 4} fill="#9eb0c9" fontSize="11">
                {formatSi(value)}
              </text>
            </g>
          );
        })}
        <line x1={left} y1={axisBottom} x2={width - 24} y2={axisBottom} stroke="rgba(255,255,255,0.20)" />
        <line x1={left} y1={top} x2={left} y2={axisBottom} stroke="rgba(255,255,255,0.20)" />
        {visibleProfiles.map((profile) => (
          <g key={`profile-${profile.profile}`}>
            {visibleMetricKeys.includes("total") ? (
              <path
                d={buildPath(
                  profile.codewords.total_codewords,
                  profile.codewords.timestamps,
                  totalMax,
                  xMin,
                  xMax,
                  left,
                  top,
                  usableWidth,
                  usableHeight,
                )}
                fill="none"
                stroke={TOTAL_CW_COLOR}
                strokeWidth="1.2"
              />
            ) : null}
            {visibleMetricKeys.includes("corrected") ? (
              <path
                d={buildPath(
                  profile.codewords.corrected,
                  profile.codewords.timestamps,
                  errorMax,
                  xMin,
                  xMax,
                  left,
                  top,
                  usableWidth,
                  usableHeight,
                )}
                fill="none"
                stroke={CORRECTED_CW_COLOR}
                strokeWidth="1.2"
              />
            ) : null}
            {visibleMetricKeys.includes("uncorrected") ? (
              <path
                d={buildPath(
                  profile.codewords.uncorrected,
                  profile.codewords.timestamps,
                  errorMax,
                  xMin,
                  xMax,
                  left,
                  top,
                  usableWidth,
                  usableHeight,
                )}
                fill="none"
                stroke={UNCORRECTED_CW_COLOR}
                strokeWidth="1.2"
              />
            ) : null}
          </g>
        ))}
        {visibleTimestamps.map((timestamp, index) => {
          if (!tickIndexes.has(index)) {
            return null;
          }
          const x = left + ((timestamp - xMin) / (xMax - xMin || 1)) * usableWidth;
          const label = formatEpochSecondsUtc(timestamp).replace(" UTC", "").slice(11);
          return (
            <text
              key={`x-${timestamp}-${index}`}
              x={x}
              y={height - 24}
              fill="#9eb0c9"
              fontSize="10"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
        <text x={width / 2} y={height - 3} fill="#9eb0c9" fontSize="11" textAnchor="middle">
          Time (UTC)
        </text>
        <rect
          data-testid="fec-zoom-overlay"
          x={left}
          y={top}
          width={usableWidth}
          height={usableHeight}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onMouseDown={(event) => {
            const svg = event.currentTarget.ownerSVGElement;
            if (!svg) return;
            const dataX = eventToDataX(event.clientX, svg);
            setDragStartX(dataX);
            setSelection([dataX, dataX]);
          }}
          onMouseMove={(event) => {
            if (dragStartX === null) return;
            const svg = event.currentTarget.ownerSVGElement;
            if (!svg) return;
            const dataX = eventToDataX(event.clientX, svg);
            setSelection([dragStartX, dataX]);
          }}
          onMouseUp={() => {
            setDragStartX(null);
          }}
          onMouseLeave={() => {
            setDragStartX(null);
          }}
          onDoubleClick={() => {
            setDragStartX(null);
            setSelection(null);
          }}
        />
      </svg>
      <div className="status-chip-row fec-series-toggle-row">
        <button
          type="button"
          className={visibleMetricKeys.includes("total") ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
          aria-pressed={visibleMetricKeys.includes("total")}
          onClick={() => {
            setVisibleMetricKeys((current) => {
              if (current.includes("total")) {
                return current.length === 1 ? current : current.filter((entry) => entry !== "total");
              }
              return [...current, "total"];
            });
          }}
        >
          <span className="analysis-swatch" style={{ backgroundColor: TOTAL_CW_COLOR }} />
          Total CW
        </button>
        <button
          type="button"
          className={visibleMetricKeys.includes("corrected") ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
          aria-pressed={visibleMetricKeys.includes("corrected")}
          onClick={() => {
            setVisibleMetricKeys((current) => {
              if (current.includes("corrected")) {
                return current.length === 1 ? current : current.filter((entry) => entry !== "corrected");
              }
              return [...current, "corrected"];
            });
          }}
        >
          <span className="analysis-swatch" style={{ backgroundColor: CORRECTED_CW_COLOR }} />
          Corrected CW
        </button>
        <button
          type="button"
          className={visibleMetricKeys.includes("uncorrected") ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
          aria-pressed={visibleMetricKeys.includes("uncorrected")}
          onClick={() => {
            setVisibleMetricKeys((current) => {
              if (current.includes("uncorrected")) {
                return current.length === 1 ? current : current.filter((entry) => entry !== "uncorrected");
              }
              return [...current, "uncorrected"];
            });
          }}
        >
          <span className="analysis-swatch" style={{ backgroundColor: UNCORRECTED_CW_COLOR }} />
          Uncorrected CW
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Profile</th>
              <th>Samples</th>
              <th>Window Start (UTC)</th>
              <th>Window End (UTC)</th>
              <th>Total CW Last</th>
              <th>Corrected CW Last</th>
              <th>Uncorrected CW Last</th>
              <th>Total CW Sum</th>
              <th>Corrected CW Sum</th>
              <th>Uncorrected CW Sum</th>
            </tr>
          </thead>
          <tbody>
            {profileTableRows.map((row) => (
              <tr key={`profile-table-${row.profile}`}>
                <td>{row.profile}</td>
                <td>{row.sampleCount}</td>
                <td className="mono">{row.windowStartLabel}</td>
                <td className="mono">{row.windowEndLabel}</td>
                <td className="mono">{row.totalLast}</td>
                <td className="mono">{row.correctedLast}</td>
                <td className="mono">{row.uncorrectedLast}</td>
                <td className="mono">{row.totalSum}</td>
                <td className="mono">{row.correctedSum}</td>
                <td className="mono">{row.uncorrectedSum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
