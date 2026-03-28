import type {
  PnmFileAnalysisResponse,
  SingleChannelEstCoeffCaptureResponse,
  SingleConstellationDisplayCaptureResponse,
  SingleFecSummaryCaptureResponse,
  SingleHistogramCaptureResponse,
  SingleModulationProfileCaptureResponse,
  SingleRxMerCaptureResponse,
} from "@/types/api";
import { PnmFileType, parsePnmFileType } from "@/types/pnmFileType";

const STORAGE_KEY_PREFIX = "pypnm.fileAnalysis.";

export type SupportedPnmFileType =
  | PnmFileType.RECEIVE_MODULATION_ERROR_RATIO
  | PnmFileType.OFDM_CHANNEL_ESTIMATE_COEFFICIENT
  | PnmFileType.OFDM_MODULATION_PROFILE
  | PnmFileType.DOWNSTREAM_CONSTELLATION_DISPLAY
  | PnmFileType.DOWNSTREAM_HISTOGRAM
  | PnmFileType.OFDM_FEC_SUMMARY;

export interface StoredFileAnalysisRecord {
  transactionId: string;
  pnmFileType: string;
  macAddress?: string;
  status: string;
  analysis: Record<string, unknown>;
  createdAt: string;
}

export function toFileAnalysisStorageKey(transactionId: string): string {
  return `${STORAGE_KEY_PREFIX}${transactionId}.${Date.now()}`;
}

export function storeFileAnalysisRecord(key: string, response: PnmFileAnalysisResponse, transactionId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const record: StoredFileAnalysisRecord = {
    transactionId,
    pnmFileType: response.pnm_file_type,
    macAddress: response.mac_address,
    status: response.status,
    analysis: response.analysis,
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(key, JSON.stringify(record));
}

export function loadFileAnalysisRecord(key: string): StoredFileAnalysisRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredFileAnalysisRecord;
  } catch {
    return null;
  }
}

export function removeFileAnalysisRecord(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

export function isSupportedPnmFileType(value: string): value is SupportedPnmFileType {
  const parsed = parsePnmFileType(value);
  return parsed === PnmFileType.RECEIVE_MODULATION_ERROR_RATIO
    || parsed === PnmFileType.OFDM_CHANNEL_ESTIMATE_COEFFICIENT
    || parsed === PnmFileType.OFDM_MODULATION_PROFILE
    || parsed === PnmFileType.DOWNSTREAM_CONSTELLATION_DISPLAY
    || parsed === PnmFileType.DOWNSTREAM_HISTOGRAM
    || parsed === PnmFileType.OFDM_FEC_SUMMARY;
}

export function toVisualResponse(
  fileType: SupportedPnmFileType,
  record: StoredFileAnalysisRecord,
):
  | SingleRxMerCaptureResponse
  | SingleChannelEstCoeffCaptureResponse
  | SingleModulationProfileCaptureResponse
  | SingleConstellationDisplayCaptureResponse
  | SingleHistogramCaptureResponse
  | SingleFecSummaryCaptureResponse {
  const systemDescription = (record.analysis.device_details as { system_description?: unknown } | undefined)?.system_description;

  switch (fileType) {
    case PnmFileType.RECEIVE_MODULATION_ERROR_RATIO:
      {
        const data: SingleRxMerCaptureResponse["data"] = {
          analysis: [record.analysis] as unknown as NonNullable<SingleRxMerCaptureResponse["data"]>["analysis"],
        };
        return {
          mac_address: record.macAddress,
          status: record.status === "success" ? 0 : undefined,
          message: null,
          system_description: systemDescription as SingleRxMerCaptureResponse["system_description"],
          data,
        };
      }
    case PnmFileType.OFDM_CHANNEL_ESTIMATE_COEFFICIENT:
      {
        const data: SingleChannelEstCoeffCaptureResponse["data"] = {
          analysis: [record.analysis] as unknown as NonNullable<SingleChannelEstCoeffCaptureResponse["data"]>["analysis"],
        };
        return {
          mac_address: record.macAddress,
          status: record.status === "success" ? 0 : undefined,
          message: null,
          system_description: systemDescription as SingleChannelEstCoeffCaptureResponse["system_description"],
          data,
        };
      }
    case PnmFileType.OFDM_MODULATION_PROFILE:
      {
        const data: SingleModulationProfileCaptureResponse["data"] = {
          analysis: [record.analysis] as unknown as NonNullable<SingleModulationProfileCaptureResponse["data"]>["analysis"],
        };
        return {
          mac_address: record.macAddress,
          status: record.status === "success" ? 0 : undefined,
          message: null,
          system_description: systemDescription as SingleModulationProfileCaptureResponse["system_description"],
          data,
        };
      }
    case PnmFileType.DOWNSTREAM_CONSTELLATION_DISPLAY:
      {
        const data: SingleConstellationDisplayCaptureResponse["data"] = {
          analysis: [record.analysis] as unknown as NonNullable<SingleConstellationDisplayCaptureResponse["data"]>["analysis"],
        };
        return {
          mac_address: record.macAddress,
          status: record.status === "success" ? 0 : undefined,
          message: null,
          system_description: systemDescription as SingleConstellationDisplayCaptureResponse["system_description"],
          data,
        };
      }
    case PnmFileType.DOWNSTREAM_HISTOGRAM:
      {
        const data: SingleHistogramCaptureResponse["data"] = {
          analysis: [record.analysis] as unknown as NonNullable<SingleHistogramCaptureResponse["data"]>["analysis"],
        };
        return {
          mac_address: record.macAddress,
          status: record.status === "success" ? 0 : undefined,
          message: null,
          system_description: systemDescription as SingleHistogramCaptureResponse["system_description"],
          data,
        };
      }
    case PnmFileType.OFDM_FEC_SUMMARY:
      {
        const data: SingleFecSummaryCaptureResponse["data"] = {
          analysis: [record.analysis] as unknown as NonNullable<SingleFecSummaryCaptureResponse["data"]>["analysis"],
        };
        return {
          mac_address: record.macAddress,
          status: record.status === "success" ? 0 : undefined,
          message: null,
          system_description: systemDescription as SingleFecSummaryCaptureResponse["system_description"],
          data,
        };
      }
  }
}
