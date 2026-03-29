import { describe, expect, it } from "vitest";

import type { ChartSeries } from "@/pw/features/analysis/types";
import { serializeCsv, seriesToCsvRows } from "@/lib/export/csv";

describe("export csv helpers", () => {
  it("aligns chart series on x values", () => {
    const series: ChartSeries[] = [
      {
        label: "Min",
        color: "#fff",
        points: [{ x: 1, y: 10 }, { x: 2, y: 11 }],
      },
      {
        label: "Max",
        color: "#000",
        points: [{ x: 2, y: 20 }, { x: 3, y: 21 }],
      },
    ];

    expect(seriesToCsvRows(series)).toEqual([
      { x: 1, Min: 10 },
      { x: 2, Min: 11, Max: 20 },
      { x: 3, Max: 21 },
    ]);
  });

  it("escapes csv values", () => {
    const csv = serializeCsv([{ label: 'a,"b"', value: 12 }], ["label", "value"]);
    expect(csv).toBe("label,value\n\"a,\"\"b\"\"\",12\n");
  });
});
