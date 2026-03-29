import {
  DEFAULT_SPECTRUM_ANALYZER_RETRIEVAL_TYPE,
  DEFAULT_SPECTRUM_ANALYZER_WINDOW_FUNCTION,
  SPECTRUM_ANALYZER_RETRIEVAL_TYPE_OPTIONS,
  SPECTRUM_ANALYZER_WINDOW_FUNCTION_OPTIONS,
  type SpectrumAnalyzerOption,
} from "@/lib/spectrumAnalyzerEnumLookup";

export type { SpectrumAnalyzerOption };

export const spectrumAnalyzerWindowFunctionOptions = SPECTRUM_ANALYZER_WINDOW_FUNCTION_OPTIONS;

export const spectrumAnalyzerRetrievalTypeOptions = SPECTRUM_ANALYZER_RETRIEVAL_TYPE_OPTIONS;

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
export const defaultSpectrumAnalyzerWindowFunction = DEFAULT_SPECTRUM_ANALYZER_WINDOW_FUNCTION;
export const defaultSpectrumAnalyzerRetrievalType = DEFAULT_SPECTRUM_ANALYZER_RETRIEVAL_TYPE;
export const defaultSpectrumAnalyzerDirection = "downstream";
export const defaultSpectrumAnalyzerNumberOfAverages = 1;
