import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useInstanceConfig } from "@/app/useInstanceConfig";
import { PageHeader } from "@/components/common/PageHeader";
import { FieldLabel } from "@/components/common/FieldLabel";
import { Panel } from "@/components/common/Panel";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";
import { requestFieldHints } from "@/pw/features/operations/requestFieldHints";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import { storeFileAnalysisRecord, toFileAnalysisStorageKey } from "@/lib/fileAnalysis";
import { storeFileHexdumpRecord, toFileHexdumpStorageKey } from "@/lib/fileHexdump";
import {
  getPnmFileAnalysis,
  getPnmFileFilenameDownloadUrl,
  getPnmFileHexdump,
  getPnmFileMacAddresses,
  getPnmFileMacArchiveDownloadUrl,
  getPnmFileOperationArchiveDownloadUrl,
  getPnmFileTransactionDownloadUrl,
  searchPnmFilesByMacAddress,
  uploadPnmFile,
} from "@/services/pnmFilesService";
import type { PnmFileAnalysisResponse, PnmFileEntry } from "@/types/api";
import { PnmFileType, parsePnmFileType } from "@/types/pnmFileType";

type InspectorState =
  | {
      mode: "idle";
      transactionId: string;
    }
  | {
      mode: "analysis";
      transactionId: string;
      data: PnmFileAnalysisResponse;
    };

type ArchivePickerMode = "files" | "operations" | null;
type SortDirection = "asc" | "desc";
type FileCatalogSortKey = "mac_address" | "timestamp" | "vendor" | "model" | "software" | "filename" | "pnm_test_type" | "transaction_id";
type OperationCatalogSortKey = "operation_id" | "mac_addresses" | "file_count" | "latest_timestamp" | "pnm_test_types" | "vendor" | "model" | "software";

interface OperationMetadataRow {
  operation_id: string;
  mac_addresses: string;
  file_count: number;
  latest_timestamp: number;
  pnm_test_types: string;
  vendor: string;
  model: string;
  software: string;
}

interface FileCatalogRow extends PnmFileEntry {
  mac_address: string;
}

function getDeviceDetailsSystemDescription(
  entry: Pick<PnmFileEntry, "system_description" | "device_details">,
): Record<string, string | number | boolean | null> | null | undefined {
  if (entry.system_description) {
    return entry.system_description;
  }

  const deviceDetails = entry.device_details;
  if (!deviceDetails) {
    return undefined;
  }

  if ("system_description" in deviceDetails && typeof deviceDetails.system_description === "object") {
    return deviceDetails.system_description;
  }

  return deviceDetails as Record<string, string | number | boolean | null>;
}

function summarizeSystemDescription(systemDescription: Record<string, string | number | boolean | null> | null | undefined): string {
  if (!systemDescription) {
    return "n/a";
  }

  const vendor = systemDescription.VENDOR;
  const model = systemDescription.MODEL;
  const software = systemDescription.SW_REV;
  return [vendor, model, software].filter((value) => value !== undefined && value !== null && `${value}`.trim() !== "").join(" / ") || "n/a";
}

function getSystemDescriptionValue(
  systemDescription: Record<string, string | number | boolean | null> | null | undefined,
  key: string,
): string {
  const fieldAliases: Record<string, string[]> = {
    VENDOR: ["VENDOR", "vendor"],
    MODEL: ["MODEL", "model"],
    SW_REV: ["SW_REV", "sw_rev", "software", "software_revision"],
  };
  const value = (fieldAliases[key] ?? [key]).map((alias) => systemDescription?.[alias]).find(
    (candidate) => candidate !== undefined && candidate !== null && `${candidate}`.trim() !== "",
  );
  return value === undefined || value === null || `${value}`.trim() === "" ? "n/a" : `${value}`;
}

function getEntrySystemDescriptionValue(entry: Pick<PnmFileEntry, "system_description" | "device_details">, key: string): string {
  return getSystemDescriptionValue(getDeviceDetailsSystemDescription(entry), key);
}

function getOperationId(entry: PnmFileEntry): string {
  const nestedOperation = (entry as PnmFileEntry & {
    operation?: {
      operation_id?: string | null;
      pnm_capture_operation_id?: string | null;
    } | null;
  }).operation;
  return entry.operation_id?.trim()
    || entry.pnm_capture_operation_id?.trim()
    || nestedOperation?.operation_id?.trim()
    || nestedOperation?.pnm_capture_operation_id?.trim()
    || "";
}

function compareValues(left: string | number, right: string | number, direction: SortDirection): number {
  const result = typeof left === "number" && typeof right === "number"
    ? left - right
    : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

function getFileCatalogSortValue(entry: FileCatalogRow, key: FileCatalogSortKey): string | number {
  if (key === "vendor" || key === "model" || key === "software") {
    return getEntrySystemDescriptionValue(entry, key === "vendor" ? "VENDOR" : key === "model" ? "MODEL" : "SW_REV");
  }
  return entry[key];
}

function getFileCount(files: Record<string, PnmFileEntry[]> | undefined): number {
  return Object.values(files ?? {}).reduce((total, entries) => total + entries.length, 0);
}

const pnmFileTypeSortOrder = Object.values(PnmFileType);

function comparePnmTestTypes(left: string, right: string): number {
  const leftType = parsePnmFileType(left);
  const rightType = parsePnmFileType(right);
  const leftIndex = leftType ? pnmFileTypeSortOrder.indexOf(leftType) : Number.MAX_SAFE_INTEGER;
  const rightIndex = rightType ? pnmFileTypeSortOrder.indexOf(rightType) : Number.MAX_SAFE_INTEGER;

  if (leftIndex !== rightIndex) {
    return leftIndex - rightIndex;
  }

  return left.localeCompare(right);
}

export function FileListPage() {
  const { selectedInstance } = useInstanceConfig();
  const inspectorPanelRef = useRef<HTMLDivElement | null>(null);
  const pendingAnalyzeWindowRef = useRef<Window | null>(null);
  const pendingHexdumpWindowRef = useRef<Window | null>(null);
  const [selectedMacAddress, setSelectedMacAddress] = useState("");
  const [macSearchInput, setMacSearchInput] = useState("");
  const [filenameDownloadInput, setFilenameDownloadInput] = useState("");
  const [operationDownloadInput, setOperationDownloadInput] = useState("");
  const [hexdumpBytesPerLine, setHexdumpBytesPerLine] = useState("16");
  const [uploadFileInput, setUploadFileInput] = useState<File | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState("");
  const [inspectorState, setInspectorState] = useState<InspectorState>({ mode: "idle", transactionId: "" });
  const [archivePickerMode, setArchivePickerMode] = useState<ArchivePickerMode>(null);
  const [fileCatalogSortKey, setFileCatalogSortKey] = useState<FileCatalogSortKey>("timestamp");
  const [fileCatalogSortDirection, setFileCatalogSortDirection] = useState<SortDirection>("desc");
  const [operationCatalogSortKey, setOperationCatalogSortKey] = useState<OperationCatalogSortKey>("latest_timestamp");
  const [operationCatalogSortDirection, setOperationCatalogSortDirection] = useState<SortDirection>("desc");

  const macAddressesQuery = useQuery({
    queryKey: ["pnm-file-mac-addresses", selectedInstance?.baseUrl],
    queryFn: () => getPnmFileMacAddresses(selectedInstance?.baseUrl ?? ""),
    enabled: Boolean(selectedInstance?.baseUrl),
  });

  useEffect(() => {
    if (selectedMacAddress !== "") {
      return;
    }
    const firstMacAddress = macAddressesQuery.data?.mac_addresses[0]?.mac_address ?? "";
    if (firstMacAddress !== "") {
      setSelectedMacAddress(firstMacAddress);
      setMacSearchInput(firstMacAddress);
    }
  }, [macAddressesQuery.data, selectedMacAddress]);

  const effectiveMacAddress = selectedMacAddress.trim().toLowerCase();

  const fileSearchQuery = useQuery({
    queryKey: ["pnm-files-by-mac", selectedInstance?.baseUrl, effectiveMacAddress],
    queryFn: () => searchPnmFilesByMacAddress(selectedInstance?.baseUrl ?? "", effectiveMacAddress),
    enabled: Boolean(selectedInstance?.baseUrl && effectiveMacAddress),
  });

  const registeredMacAddresses = useMemo(
    () => (macAddressesQuery.data?.mac_addresses ?? []).map((entry) => entry.mac_address.toLowerCase()),
    [macAddressesQuery.data],
  );

  const systemDescriptionByMacAddress = useMemo(() => {
    const entries = new Map<string, Record<string, string | number | boolean | null>>();
    for (const entry of macAddressesQuery.data?.mac_addresses ?? []) {
      if (entry.system_description) {
        entries.set(entry.mac_address.toLowerCase(), entry.system_description);
      }
    }
    return entries;
  }, [macAddressesQuery.data]);

  const fileCatalogQuery = useQuery({
    queryKey: ["pnm-file-catalog", selectedInstance?.baseUrl, registeredMacAddresses, systemDescriptionByMacAddress],
    queryFn: async () => {
      const responses = await Promise.all(
        registeredMacAddresses.map((macAddress) => searchPnmFilesByMacAddress(selectedInstance?.baseUrl ?? "", macAddress)),
      );

      return responses.flatMap((response, index) => {
        const macAddress = registeredMacAddresses[index];
        return (response.files?.[macAddress] ?? []).map((entry): FileCatalogRow => ({
          ...entry,
          mac_address: macAddress,
          system_description: getDeviceDetailsSystemDescription(entry) ?? systemDescriptionByMacAddress.get(macAddress) ?? null,
        }));
      });
    },
    enabled: Boolean(selectedInstance?.baseUrl && registeredMacAddresses.length > 0),
  });

  const selectedFiles = useMemo(
    () => fileSearchQuery.data?.files?.[effectiveMacAddress] ?? [],
    [effectiveMacAddress, fileSearchQuery.data],
  );

  const fileCatalogRows = useMemo(() => fileCatalogQuery.data ?? [], [fileCatalogQuery.data]);

  const groupedSelectedFiles = useMemo(() => {
    const filesByType = new Map<string, PnmFileEntry[]>();

    for (const entry of selectedFiles) {
      const key = entry.pnm_test_type?.trim() || "UNKNOWN";
      const existingEntries = filesByType.get(key);
      if (existingEntries) {
        existingEntries.push(entry);
      } else {
        filesByType.set(key, [entry]);
      }
    }

    return Array.from(filesByType.entries())
      .sort(([leftType], [rightType]) => comparePnmTestTypes(leftType, rightType))
      .map(([pnmTestType, entries]) => ({
        pnmTestType,
        entries: [...entries].sort((left, right) => right.timestamp - left.timestamp),
      }));
  }, [selectedFiles]);

  const sortedFileCatalogRows = useMemo(() => {
    return [...fileCatalogRows].sort((left, right) => {
      const leftValue = getFileCatalogSortValue(left, fileCatalogSortKey);
      const rightValue = getFileCatalogSortValue(right, fileCatalogSortKey);
      return compareValues(leftValue, rightValue, fileCatalogSortDirection);
    });
  }, [fileCatalogRows, fileCatalogSortDirection, fileCatalogSortKey]);

  const operationCatalogRows = useMemo(() => {
    const rows = new Map<string, OperationMetadataRow>();

    for (const entry of fileCatalogRows) {
      const operationId = getOperationId(entry);
      if (!operationId) {
        continue;
      }

      const existing = rows.get(operationId);
      const pnmTypes = new Set((existing?.pnm_test_types ?? "").split(", ").filter(Boolean));
      pnmTypes.add(entry.pnm_test_type);
      const macAddresses = new Set((existing?.mac_addresses ?? "").split(", ").filter(Boolean));
      macAddresses.add(entry.mac_address);

      rows.set(operationId, {
        operation_id: operationId,
        mac_addresses: Array.from(macAddresses).sort((left, right) => left.localeCompare(right)).join(", "),
        file_count: (existing?.file_count ?? 0) + 1,
        latest_timestamp: Math.max(existing?.latest_timestamp ?? 0, entry.timestamp),
        pnm_test_types: Array.from(pnmTypes).sort((left, right) => left.localeCompare(right)).join(", "),
        vendor: existing?.vendor && existing.vendor !== "n/a" ? existing.vendor : getEntrySystemDescriptionValue(entry, "VENDOR"),
        model: existing?.model && existing.model !== "n/a" ? existing.model : getEntrySystemDescriptionValue(entry, "MODEL"),
        software: existing?.software && existing.software !== "n/a" ? existing.software : getEntrySystemDescriptionValue(entry, "SW_REV"),
      });
    }

    return Array.from(rows.values()).sort((left, right) => (
      compareValues(left[operationCatalogSortKey], right[operationCatalogSortKey], operationCatalogSortDirection)
    ));
  }, [fileCatalogRows, operationCatalogSortDirection, operationCatalogSortKey]);

  function focusInspector() {
    inspectorPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hexdumpMutation = useMutation({
    mutationFn: async (transactionId: string) =>
      getPnmFileHexdump(selectedInstance?.baseUrl ?? "", transactionId, Number.parseInt(hexdumpBytesPerLine, 10) || 16),
    onSuccess: (data, transactionId) => {
      const hexdumpKey = toFileHexdumpStorageKey(transactionId);
      storeFileHexdumpRecord(hexdumpKey, data, transactionId);
      const url = `/files/hexdump/${encodeURIComponent(hexdumpKey)}`;
      if (pendingHexdumpWindowRef.current && !pendingHexdumpWindowRef.current.closed) {
        pendingHexdumpWindowRef.current.location.href = url;
      } else {
        window.open(url, "_blank");
      }
      pendingHexdumpWindowRef.current = null;
      setSelectedTransactionId(transactionId);
    },
    onError: () => {
      if (pendingHexdumpWindowRef.current && !pendingHexdumpWindowRef.current.closed) {
        pendingHexdumpWindowRef.current.close();
      }
      pendingHexdumpWindowRef.current = null;
      focusInspector();
    },
  });

  const analysisMutation = useMutation({
    mutationFn: async (transactionId: string) => getPnmFileAnalysis(selectedInstance?.baseUrl ?? "", transactionId),
    onSuccess: (data, transactionId) => {
      setInspectorState({ mode: "analysis", transactionId, data });
      setSelectedTransactionId(transactionId);
      focusInspector();
    },
    onError: () => {
      focusInspector();
    },
  });

  const analyzeVisualMutation = useMutation({
    mutationFn: async (transactionId: string) => getPnmFileAnalysis(selectedInstance?.baseUrl ?? "", transactionId),
    onSuccess: (data, transactionId) => {
      const analysisKey = toFileAnalysisStorageKey(transactionId);
      storeFileAnalysisRecord(analysisKey, data, transactionId);
      const url = `/files/analyze/${encodeURIComponent(analysisKey)}`;
      if (pendingAnalyzeWindowRef.current && !pendingAnalyzeWindowRef.current.closed) {
        pendingAnalyzeWindowRef.current.location.href = url;
      } else {
        window.open(url, "_blank");
      }
      pendingAnalyzeWindowRef.current = null;
    },
    onError: () => {
      if (pendingAnalyzeWindowRef.current && !pendingAnalyzeWindowRef.current.closed) {
        pendingAnalyzeWindowRef.current.close();
      }
      pendingAnalyzeWindowRef.current = null;
      focusInspector();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => uploadPnmFile(selectedInstance?.baseUrl ?? "", file),
  });

  function startInspectorAction(transactionId: string) {
    setSelectedTransactionId(transactionId);
    setInspectorState({ mode: "idle", transactionId });
    focusInspector();
  }

  function updateFileCatalogSort(nextKey: FileCatalogSortKey) {
    if (fileCatalogSortKey === nextKey) {
      setFileCatalogSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setFileCatalogSortKey(nextKey);
    setFileCatalogSortDirection(nextKey === "timestamp" ? "desc" : "asc");
  }

  function updateOperationCatalogSort(nextKey: OperationCatalogSortKey) {
    if (operationCatalogSortKey === nextKey) {
      setOperationCatalogSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setOperationCatalogSortKey(nextKey);
    setOperationCatalogSortDirection(nextKey === "latest_timestamp" ? "desc" : "asc");
  }

  function fileSortLabel(label: string, key: FileCatalogSortKey): string {
    if (fileCatalogSortKey !== key) {
      return label;
    }
    return `${label}${fileCatalogSortDirection === "asc" ? " ▲" : " ▼"}`;
  }

  function operationSortLabel(label: string, key: OperationCatalogSortKey): string {
    if (operationCatalogSortKey !== key) {
      return label;
    }
    return `${label}${operationCatalogSortDirection === "asc" ? " ▲" : " ▼"}`;
  }

  const uploadedFile = uploadMutation.data;
  const fileCount = getFileCount(fileSearchQuery.data?.files);

  return (
    <>
      <PageHeader
        title="Files"
        subtitle="Browse stored captures, upload raw PNM files, inspect hexdumps, and trigger transaction analysis."
      />

      <div className="grid two files-grid">
        <Panel title="Browse">
          <div className="files-toolbar">
            <div className="files-toolbar-field">
              <FieldLabel htmlFor="files-mac-search" hint={requestFieldHints.file_mac_search}>MAC Address</FieldLabel>
              <input
                id="files-mac-search"
                value={macSearchInput}
                onChange={(event) => setMacSearchInput(event.target.value)}
                placeholder="aa:bb:cc:dd:ee:ff"
              />
            </div>
            <div className="files-toolbar-actions">
              <button
                type="button"
                className="primary"
                disabled={!selectedInstance || macSearchInput.trim() === ""}
                onClick={() => setSelectedMacAddress(macSearchInput.trim().toLowerCase())}
              >
                Search
              </button>
            </div>
          </div>
          {selectedInstance ? (
            <div className="files-summary-row">
              <span className="analysis-chip"><b>Target</b> {selectedInstance.label}</span>
              <span className="analysis-chip"><b>MAC:</b> {effectiveMacAddress || "n/a"}</span>
              <span className="analysis-chip"><b>File Count</b> {fileCount}</span>
            </div>
          ) : (
            <p className="panel-copy">Select a PyPNM target first.</p>
          )}
        </Panel>

        <Panel title="Upload">
          <div className="files-upload-grid">
            <div className="files-toolbar-field">
              <FieldLabel htmlFor="files-upload-input" hint={requestFieldHints.upload_pnm_file}>PNM File</FieldLabel>
              <input
                id="files-upload-input"
                type="file"
                onChange={(event) => setUploadFileInput(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="files-toolbar-actions">
              <button
                type="button"
                className="primary"
                disabled={!selectedInstance || uploadFileInput === null || uploadMutation.isPending}
                onClick={() => {
                  if (uploadFileInput) {
                    uploadMutation.mutate(uploadFileInput);
                  }
                }}
              >
                {uploadMutation.isPending ? "Collecting..." : "Upload File"}
              </button>
            </div>
          </div>
          {uploadMutation.isPending ? <ThinkingIndicator label="Collecting uploaded file metadata..." compact /> : null}
          {uploadMutation.isError ? <p className="panel-copy files-error">{(uploadMutation.error as Error).message}</p> : null}
          {uploadedFile ? (
            <div className="files-inspector-meta">
              <span className="analysis-chip"><b>MAC</b> {uploadedFile.mac_address}</span>
              <span className="analysis-chip"><b>Filename</b> {uploadedFile.filename}</span>
              <span className="analysis-chip"><b>Transaction</b> {uploadedFile.transaction_id}</span>
            </div>
          ) : null}
        </Panel>
      </div>

      <Panel title="Archive And Direct Download">
        <div className="files-picker-toolbar">
          <button
            type="button"
            className="secondary"
            disabled={fileCatalogRows.length === 0}
            onClick={() => setArchivePickerMode("files")}
          >
            Files
          </button>
          <button
            type="button"
            className="secondary"
            disabled={fileCatalogRows.length === 0}
            onClick={() => setArchivePickerMode("operations")}
          >
            Operation IDs
          </button>
        </div>
        {fileCatalogQuery.isLoading ? <ThinkingIndicator label="Collecting transaction file catalog..." compact /> : null}
        {fileCatalogQuery.isError ? <p className="panel-copy files-error">{(fileCatalogQuery.error as Error).message}</p> : null}
        <div className="files-direct-grid">
          <div className="files-toolbar-field">
            <FieldLabel htmlFor="files-filename-download" hint={requestFieldHints.direct_downloads}>Filename</FieldLabel>
            <input
              id="files-filename-download"
              value={filenameDownloadInput}
              onChange={(event) => setFilenameDownloadInput(event.target.value)}
              placeholder="stored_file.bin.zst"
            />
          </div>
          <div className="files-toolbar-field">
            <FieldLabel htmlFor="files-operation-download" hint={requestFieldHints.direct_downloads}>Operation ID</FieldLabel>
            <input
              id="files-operation-download"
              value={operationDownloadInput}
              onChange={(event) => setOperationDownloadInput(event.target.value)}
              placeholder="operation-id"
            />
          </div>
          <div className="files-toolbar-actions">
            {selectedInstance && effectiveMacAddress !== "" ? (
              <a
                className="secondary button-link"
                href={getPnmFileMacArchiveDownloadUrl(selectedInstance.baseUrl, effectiveMacAddress)}
              >
                Download MAC Archive
              </a>
            ) : null}
            {selectedInstance && filenameDownloadInput.trim() !== "" ? (
              <a
                className="secondary button-link"
                href={getPnmFileFilenameDownloadUrl(selectedInstance.baseUrl, filenameDownloadInput.trim())}
              >
                Download By Filename
              </a>
            ) : null}
            {selectedInstance && operationDownloadInput.trim() !== "" ? (
              <a
                className="secondary button-link"
                href={getPnmFileOperationArchiveDownloadUrl(selectedInstance.baseUrl, operationDownloadInput.trim())}
              >
                Download Operation Archive
              </a>
            ) : null}
          </div>
        </div>
      </Panel>

      <details className="panel files-registered-macs-panel" open>
        <summary className="files-registered-macs-summary">
          <div className="files-type-summary-main">
            <span className="files-type-label">Registered MAC Addresses</span>
            <span className="analysis-chip"><b>Count</b> {macAddressesQuery.data?.mac_addresses.length ?? 0}</span>
          </div>
          <span className="files-type-chevron" aria-hidden="true" />
        </summary>
        {macAddressesQuery.isLoading ? <ThinkingIndicator label="Collecting registered MAC addresses..." /> : null}
        {macAddressesQuery.isError ? <p className="panel-copy files-error">{(macAddressesQuery.error as Error).message}</p> : null}
        {!macAddressesQuery.isLoading && !macAddressesQuery.isError ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MAC Address</th>
                  <th>Vendor</th>
                  <th>Model</th>
                  <th>Software</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(macAddressesQuery.data?.mac_addresses ?? []).map((entry) => {
                  const isSelected = entry.mac_address === effectiveMacAddress;
                  return (
                    <tr key={entry.mac_address} className={isSelected ? "is-selected" : undefined}>
                      <td className="mono">{entry.mac_address}</td>
                      <td>{getSystemDescriptionValue(entry.system_description, "VENDOR")}</td>
                      <td>{getSystemDescriptionValue(entry.system_description, "MODEL")}</td>
                      <td>{getSystemDescriptionValue(entry.system_description, "SW_REV")}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setMacSearchInput(entry.mac_address);
                            setSelectedMacAddress(entry.mac_address);
                          }}
                        >
                          View Files
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </details>

      <Panel
        title={(
          <div className="panel-title-inline">
            <h2 className="panel-title-heading">Files For Selected MAC</h2>
            <span className="analysis-chip"><b>MAC:</b> {effectiveMacAddress || "n/a"}</span>
          </div>
        )}
      >
        {effectiveMacAddress === "" ? (
          <p className="panel-copy">Select or search for a MAC address to load file entries.</p>
        ) : null}
        {fileSearchQuery.isLoading ? <ThinkingIndicator label="Collecting file entries..." /> : null}
        {fileSearchQuery.isError ? <p className="panel-copy files-error">{(fileSearchQuery.error as Error).message}</p> : null}
        {!fileSearchQuery.isLoading && !fileSearchQuery.isError && effectiveMacAddress !== "" ? (
          selectedFiles.length > 0 ? (
            <div className="files-type-groups">
              {groupedSelectedFiles.map(({ pnmTestType, entries }) => (
                <details key={pnmTestType} className="files-type-card">
                  <summary className="files-type-summary">
                    <div className="files-type-summary-main">
                      <span className="files-type-label">{pnmTestType}</span>
                      <span className="analysis-chip"><b>Files</b> {entries.length}</span>
                    </div>
                    <span className="files-type-chevron" aria-hidden="true" />
                  </summary>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Filename</th>
                          <th>PNM Test Type</th>
                          <th>Timestamp</th>
                          <th>System Description</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry) => {
                          const isSelected = entry.transaction_id === selectedTransactionId;
                          return (
                            <tr key={entry.transaction_id} className={isSelected ? "is-selected" : undefined}>
                              <td className="mono">{entry.transaction_id}</td>
                              <td className="mono files-filename">{entry.filename}</td>
                              <td>{entry.pnm_test_type}</td>
                              <td>{formatEpochSecondsUtc(entry.timestamp) ?? "n/a"}</td>
                              <td>{summarizeSystemDescription(getDeviceDetailsSystemDescription(entry))}</td>
                              <td className="files-actions-cell">
                                <div className="files-row-actions">
                                  {selectedInstance ? (
                                    <a
                                      className="secondary button-link"
                                      href={getPnmFileTransactionDownloadUrl(selectedInstance.baseUrl, entry.transaction_id)}
                                    >
                                      Download
                                    </a>
                                  ) : null}
                                  <button
                                    type="button"
                                    className="secondary"
                                    disabled={!selectedInstance || hexdumpMutation.isPending}
                                    onClick={() => {
                                      pendingHexdumpWindowRef.current = window.open("about:blank", "_blank");
                                      setSelectedTransactionId(entry.transaction_id);
                                      hexdumpMutation.mutate(entry.transaction_id);
                                    }}
                                  >
                                    Hexdump
                                  </button>
                                  <button
                                    type="button"
                                    className="secondary"
                                    disabled={!selectedInstance || analysisMutation.isPending}
                                    onClick={() => {
                                      startInspectorAction(entry.transaction_id);
                                      analysisMutation.mutate(entry.transaction_id);
                                    }}
                                  >
                                    JSON
                                  </button>
                                  <button
                                    type="button"
                                    className="secondary"
                                    disabled={!selectedInstance || analyzeVisualMutation.isPending}
                                    onClick={() => {
                                      pendingAnalyzeWindowRef.current = window.open("about:blank", "_blank");
                                      startInspectorAction(entry.transaction_id);
                                      analyzeVisualMutation.mutate(entry.transaction_id);
                                    }}
                                  >
                                    Analyze
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="panel-copy">No stored files found for that MAC address.</p>
          )
        ) : null}
      </Panel>

      <div ref={inspectorPanelRef}>
        <Panel title="Inspect Selected Transaction">
          <div className="files-toolbar">
            <div className="files-toolbar-field files-bytes-field">
              <FieldLabel htmlFor="files-bytes-per-line" hint={requestFieldHints.hexdump_bytes_per_line}>
                Hexdump Bytes / Line
              </FieldLabel>
              <input
                id="files-bytes-per-line"
                value={hexdumpBytesPerLine}
              onChange={(event) => setHexdumpBytesPerLine(event.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>
        {hexdumpMutation.isPending ? <ThinkingIndicator label="Collecting hexdump..." /> : null}
        {analysisMutation.isPending ? <ThinkingIndicator label="Collecting file analysis..." /> : null}
        {analyzeVisualMutation.isPending ? <ThinkingIndicator label="Collecting visual analysis..." /> : null}
        {hexdumpMutation.isError ? <p className="panel-copy files-error">{(hexdumpMutation.error as Error).message}</p> : null}
        {analysisMutation.isError ? <p className="panel-copy files-error">{(analysisMutation.error as Error).message}</p> : null}
        {analyzeVisualMutation.isError ? <p className="panel-copy files-error">{(analyzeVisualMutation.error as Error).message}</p> : null}
        {inspectorState.mode === "idle" ? (
          selectedTransactionId !== "" ? (
            <div className="files-inspector-meta">
              <span className="analysis-chip"><b>Transaction</b> {selectedTransactionId}</span>
            </div>
          ) : (
            <p className="panel-copy">Select a transaction from the file table, then open a hexdump or run analysis.</p>
          )
        ) : null}
        {inspectorState.mode === "analysis" ? (
          <>
            <div className="files-inspector-meta">
              <span className="analysis-chip"><b>Mode</b> Analysis</span>
              <span className="analysis-chip"><b>Transaction</b> {inspectorState.transactionId}</span>
              <span className="analysis-chip"><b>PNM File Type</b> {inspectorState.data.pnm_file_type}</span>
              <span className="analysis-chip"><b>Status</b> {inspectorState.data.status}</span>
            </div>
            <pre className="files-hexdump-viewer">
              {JSON.stringify(inspectorState.data.analysis, null, 2)}
            </pre>
          </>
        ) : null}
        </Panel>
      </div>

      {archivePickerMode ? (
        <div
          className="selection-insights-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="files-archive-picker-title"
          onClick={() => setArchivePickerMode(null)}
        >
          <div className="selection-insights-modal-card files-archive-picker-modal" onClick={(event) => event.stopPropagation()}>
            <div className="selection-insights-modal-header">
              <h3 id="files-archive-picker-title" className="selection-insights-modal-title">
                {archivePickerMode === "files" ? "Select File" : "Select Operation ID"}
              </h3>
              <button type="button" className="selection-insights-modal-close" onClick={() => setArchivePickerMode(null)}>
                Close
              </button>
            </div>
            {archivePickerMode === "files" ? (
              <div className="table-wrap files-archive-picker-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        <button type="button" className="table-sort-button" onClick={() => updateFileCatalogSort("mac_address")}>
                          {fileSortLabel("MAC", "mac_address")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className="table-sort-button" onClick={() => updateFileCatalogSort("timestamp")}>
                          {fileSortLabel("Timestamp", "timestamp")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className="table-sort-button" onClick={() => updateFileCatalogSort("vendor")}>
                          {fileSortLabel("Vendor", "vendor")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className="table-sort-button" onClick={() => updateFileCatalogSort("model")}>
                          {fileSortLabel("Model", "model")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className="table-sort-button" onClick={() => updateFileCatalogSort("software")}>
                          {fileSortLabel("Software", "software")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className="table-sort-button" onClick={() => updateFileCatalogSort("filename")}>
                          {fileSortLabel("Filename", "filename")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className="table-sort-button" onClick={() => updateFileCatalogSort("pnm_test_type")}>
                          {fileSortLabel("PNM Type", "pnm_test_type")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className="table-sort-button" onClick={() => updateFileCatalogSort("transaction_id")}>
                          {fileSortLabel("Transaction ID", "transaction_id")}
                        </button>
                      </th>
                      <th className="files-picker-select-column">Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFileCatalogRows.map((entry) => (
                      <tr key={entry.transaction_id}>
                        <td className="mono">{entry.mac_address}</td>
                        <td>{formatEpochSecondsUtc(entry.timestamp) ?? "n/a"}</td>
                        <td>{getEntrySystemDescriptionValue(entry, "VENDOR")}</td>
                        <td>{getEntrySystemDescriptionValue(entry, "MODEL")}</td>
                        <td>{getEntrySystemDescriptionValue(entry, "SW_REV")}</td>
                        <td className="mono files-filename">{entry.filename}</td>
                        <td>{entry.pnm_test_type}</td>
                        <td className="mono">{entry.transaction_id}</td>
                        <td className="files-picker-select-column">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              setFilenameDownloadInput(entry.filename);
                              setArchivePickerMode(null);
                            }}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                {operationCatalogRows.length === 0 ? (
                  <p className="panel-copy">
                    No operation IDs were present in the selected file metadata.
                  </p>
                ) : (
                  <div className="table-wrap files-archive-picker-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>
                            <button type="button" className="table-sort-button" onClick={() => updateOperationCatalogSort("operation_id")}>
                              {operationSortLabel("Operation ID", "operation_id")}
                            </button>
                          </th>
                          <th>
                            <button type="button" className="table-sort-button" onClick={() => updateOperationCatalogSort("mac_addresses")}>
                              {operationSortLabel("MACs", "mac_addresses")}
                            </button>
                          </th>
                          <th>
                            <button type="button" className="table-sort-button" onClick={() => updateOperationCatalogSort("file_count")}>
                              {operationSortLabel("Files", "file_count")}
                            </button>
                          </th>
                          <th>
                            <button type="button" className="table-sort-button" onClick={() => updateOperationCatalogSort("latest_timestamp")}>
                              {operationSortLabel("Latest Timestamp", "latest_timestamp")}
                            </button>
                          </th>
                          <th>
                            <button type="button" className="table-sort-button" onClick={() => updateOperationCatalogSort("pnm_test_types")}>
                              {operationSortLabel("PNM Types", "pnm_test_types")}
                            </button>
                          </th>
                          <th>
                            <button type="button" className="table-sort-button" onClick={() => updateOperationCatalogSort("vendor")}>
                              {operationSortLabel("Vendor", "vendor")}
                            </button>
                          </th>
                          <th>
                            <button type="button" className="table-sort-button" onClick={() => updateOperationCatalogSort("model")}>
                              {operationSortLabel("Model", "model")}
                            </button>
                          </th>
                          <th>
                            <button type="button" className="table-sort-button" onClick={() => updateOperationCatalogSort("software")}>
                              {operationSortLabel("Software", "software")}
                            </button>
                          </th>
                          <th className="files-picker-select-column">Select</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operationCatalogRows.map((entry) => (
                          <tr key={entry.operation_id}>
                            <td className="mono">{entry.operation_id}</td>
                            <td className="mono">{entry.mac_addresses}</td>
                            <td>{entry.file_count}</td>
                            <td>{formatEpochSecondsUtc(entry.latest_timestamp) ?? "n/a"}</td>
                            <td>{entry.pnm_test_types || "n/a"}</td>
                            <td>{entry.vendor}</td>
                            <td>{entry.model}</td>
                            <td>{entry.software}</td>
                            <td className="files-picker-select-column">
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                  setOperationDownloadInput(entry.operation_id);
                                  setArchivePickerMode(null);
                                }}
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
