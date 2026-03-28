import { requestWithBaseUrl } from "@/services/http";
import type {
  PnmFileAnalysisResponse,
  PnmFileHexdumpResponse,
  PnmFileMacAddressResponse,
  PnmFileQueryResponse,
  PnmFileUploadResponse,
} from "@/types/api";

export async function getPnmFileMacAddresses(baseUrl: string): Promise<PnmFileMacAddressResponse> {
  const response = await requestWithBaseUrl<PnmFileMacAddressResponse>(baseUrl, {
    method: "GET",
    url: "/docs/pnm/files/getMacAddresses/",
  });
  return response.data;
}

export async function searchPnmFilesByMacAddress(baseUrl: string, macAddress: string): Promise<PnmFileQueryResponse> {
  const response = await requestWithBaseUrl<PnmFileQueryResponse>(baseUrl, {
    method: "GET",
    url: `/docs/pnm/files/searchFiles/${encodeURIComponent(macAddress)}`,
  });
  return response.data;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

export function getPnmFileTransactionDownloadUrl(baseUrl: string, transactionId: string): string {
  return `${normalizeBaseUrl(baseUrl)}/docs/pnm/files/download/transactionID/${encodeURIComponent(transactionId)}`;
}

export function getPnmFileFilenameDownloadUrl(baseUrl: string, filename: string): string {
  return `${normalizeBaseUrl(baseUrl)}/docs/pnm/files/download/filename/${encodeURIComponent(filename)}`;
}

export function getPnmFileMacArchiveDownloadUrl(baseUrl: string, macAddress: string): string {
  return `${normalizeBaseUrl(baseUrl)}/docs/pnm/files/download/macAddress/${encodeURIComponent(macAddress)}`;
}

export function getPnmFileOperationArchiveDownloadUrl(baseUrl: string, operationId: string): string {
  return `${normalizeBaseUrl(baseUrl)}/docs/pnm/files/download/operationID/${encodeURIComponent(operationId)}`;
}

export async function uploadPnmFile(baseUrl: string, file: File): Promise<PnmFileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await requestWithBaseUrl<PnmFileUploadResponse>(baseUrl, {
    method: "POST",
    url: "/docs/pnm/files/upload",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function getPnmFileHexdump(
  baseUrl: string,
  transactionId: string,
  bytesPerLine = 16,
): Promise<PnmFileHexdumpResponse> {
  const response = await requestWithBaseUrl<PnmFileHexdumpResponse>(baseUrl, {
    method: "GET",
    url: `/docs/pnm/files/getHexdump/transactionID/${encodeURIComponent(transactionId)}`,
    params: {
      bytes_per_line: bytesPerLine,
    },
  });
  return response.data;
}

export async function getPnmFileAnalysis(baseUrl: string, transactionId: string): Promise<PnmFileAnalysisResponse> {
  const response = await requestWithBaseUrl<PnmFileAnalysisResponse>(baseUrl, {
    method: "POST",
    url: "/docs/pnm/files/getAnalysis",
    data: {
      search: {
        transaction_id: transactionId,
      },
      analysis: {
        type: "basic",
        output: {
          type: "json",
        },
        plot: {
          ui: {
            theme: "dark",
          },
        },
      },
    },
  });
  return response.data;
}

export function getPnmFileDownloadUrl(baseUrl: string, transactionId: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  return `${normalizedBaseUrl}/docs/pnm/files/download/transactionID/${encodeURIComponent(transactionId)}`;
}
