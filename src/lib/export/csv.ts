import type { ChartSeries } from "@/features/analysis/types";

import { downloadBlob, withExtension } from "@/lib/export/download";

type CsvValue = string | number | boolean | null | undefined;
export type CsvRow = Record<string, CsvValue>;

function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }

  return stringValue;
}

export function serializeCsv(rows: CsvRow[], columnOrder?: string[]): string {
  if (!rows.length) {
    return "";
  }

  const columns = columnOrder?.length ? columnOrder : Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const lines = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(row[column])).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

export function downloadCsv(baseName: string, rows: CsvRow[], columnOrder?: string[]): void {
  const csv = serializeCsv(rows, columnOrder);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(withExtension(baseName, "csv"), blob);
}

export function seriesToCsvRows(series: ChartSeries[]): CsvRow[] {
  const xValueOrder = new Map<number, CsvRow>();

  for (const item of series) {
    for (const point of item.points) {
      const existing = xValueOrder.get(point.x) ?? { x: point.x };
      existing[item.label] = point.y;
      xValueOrder.set(point.x, existing);
    }
  }

  return Array.from(xValueOrder.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([, row]) => row);
}
