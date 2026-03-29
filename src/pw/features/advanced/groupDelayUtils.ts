export function normalizeGroupDelayUs(values: number[]): number[] {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const maxAbs = numericValues.reduce((currentMax, value) => Math.max(currentMax, Math.abs(value)), 0);
  const scale = maxAbs > 0 && maxAbs < 1e-3 ? 1_000_000 : 1;

  return values.map((value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue * scale : 0;
  });
}
