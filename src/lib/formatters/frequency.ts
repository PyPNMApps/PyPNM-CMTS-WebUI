export function formatFrequencyRangeMhz(frequencyHz: number[] | undefined): string {
  if (!frequencyHz?.length) {
    return "Frequency range unavailable";
  }

  const start = Math.round((frequencyHz[0] ?? 0) / 1_000_000);
  const end = Math.round((frequencyHz[frequencyHz.length - 1] ?? 0) / 1_000_000);
  return `${start} - ${end} MHz`;
}
