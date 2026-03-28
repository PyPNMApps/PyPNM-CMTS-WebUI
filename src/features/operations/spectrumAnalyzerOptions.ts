export interface SpectrumAnalyzerOption {
  value: number;
  label: string;
}

export const spectrumAnalyzerWindowFunctionOptions: SpectrumAnalyzerOption[] = [
  { value: 0, label: "Other" },
  { value: 1, label: "Hann" },
  { value: 2, label: "Blackman Harris" },
  { value: 3, label: "Rectangular" },
  { value: 4, label: "Hamming" },
  { value: 5, label: "Flat Top" },
  { value: 6, label: "Gaussian" },
  { value: 7, label: "Chebyshev" },
];

export const spectrumAnalyzerRetrievalTypeOptions: SpectrumAnalyzerOption[] = [
  { value: 1, label: "PNM File" },
  { value: 2, label: "SNMP" },
];

export const spectrumAnalyzerDirectionOptions = [
  { value: "downstream", label: "Downstream" },
  { value: "upstream", label: "Upstream" },
] as const;

export const DEFAULT_SPECTRUM_ANALYZER_MOVING_AVERAGE_POINTS = 10;
export const DEFAULT_SPECTRUM_ANALYZER_INACTIVITY_TIMEOUT_SECONDS = 60;
export const DEFAULT_SPECTRUM_ANALYZER_FRIENDLY_FIRST_SEGMENT_CENTER_FREQ_HZ = 300_000_000;
export const DEFAULT_SPECTRUM_ANALYZER_FRIENDLY_LAST_SEGMENT_CENTER_FREQ_HZ = 900_000_000;
export const DEFAULT_SPECTRUM_ANALYZER_FRIENDLY_RESOLUTION_BW_HZ = 30_000;
export const DEFAULT_SPECTRUM_ANALYZER_FULL_BAND_RESOLUTION_BW_HZ = 300_000;
export const DEFAULT_SPECTRUM_ANALYZER_OFDM_RESOLUTION_BANDWIDTH_HZ = 25_000;
export const DEFAULT_SPECTRUM_ANALYZER_NOISE_BW_HZ = 150;
export const defaultSpectrumAnalyzerWindowFunction = 1;
export const defaultSpectrumAnalyzerRetrievalType = 2;
export const defaultSpectrumAnalyzerDirection = "downstream";
export const defaultSpectrumAnalyzerNumberOfAverages = 1;
