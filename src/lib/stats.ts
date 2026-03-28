export interface ValueSummary {
  avg: number;
  min: number;
  max: number;
}

export function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function summarize(values: number[]): ValueSummary {
  if (!values.length) {
    return { avg: 0, min: 0, max: 0 };
  }

  return {
    avg: average(values),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
