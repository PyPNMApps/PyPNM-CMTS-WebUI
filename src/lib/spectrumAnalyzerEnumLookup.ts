export interface SpectrumAnalyzerOption {
  value: number;
  label: string;
}

export const SPECTRUM_ANALYZER_WINDOW_FUNCTION_OPTIONS: SpectrumAnalyzerOption[] = [
  { value: 0, label: "Other" },
  { value: 1, label: "Hann" },
  { value: 2, label: "Blackman Harris" },
  { value: 3, label: "Rectangular" },
  { value: 4, label: "Hamming" },
  { value: 5, label: "Flat Top" },
  { value: 6, label: "Gaussian" },
  { value: 7, label: "Chebyshev" },
];

export const SPECTRUM_ANALYZER_RETRIEVAL_TYPE_OPTIONS: SpectrumAnalyzerOption[] = [
  { value: 1, label: "PNM File" },
  { value: 2, label: "SNMP" },
];

export const DEFAULT_SPECTRUM_ANALYZER_WINDOW_FUNCTION = 1;
export const DEFAULT_SPECTRUM_ANALYZER_RETRIEVAL_TYPE = 2;

export function getSpectrumAnalyzerWindowFunctionLabel(value: number): string {
  return SPECTRUM_ANALYZER_WINDOW_FUNCTION_OPTIONS.find((option) => option.value === value)?.label ?? `Unknown (${value})`;
}

export function getSpectrumAnalyzerRetrievalTypeLabel(value: number): string {
  return SPECTRUM_ANALYZER_RETRIEVAL_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? `Unknown (${value})`;
}

