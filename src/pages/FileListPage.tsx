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

function summarizeSystemDescription(systemDescription: Record<string, string | number | boolean | null> | null | undefined): string {
  if (!systemDescription) {
    return "n/a";
  }

  const vendor = systemDescription.VENDOR;
  const model = systemDescription.MODEL;
  const software = systemDescription.SW_REV;
  return [vendor, model, software].filter((value) => value !== undefined && value !== null && `${value}`.trim() !== "").join(" / ") || "n/a";
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

  const selectedFiles = useMemo(
    () => fileSearchQuery.data?.files?.[effectiveMacAddress] ?? [],
    [effectiveMacAddress, fileSearchQuery.data],
  );

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
              {selectedInstance && effectiveMacAddress !== "" ? (
                <a
                  className="secondary button-link"
                  href={getPnmFileMacArchiveDownloadUrl(selectedInstance.baseUrl, effectiveMacAddress)}
                >
                  Download MAC Archive
                </a>
              ) : null}
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

      <div className="grid two files-grid">
        <Panel title="Registered MAC Addresses">
          {macAddressesQuery.isLoading ? <ThinkingIndicator label="Collecting registered MAC addresses..." /> : null}
          {macAddressesQuery.isError ? <p className="panel-copy files-error">{(macAddressesQuery.error as Error).message}</p> : null}
          {!macAddressesQuery.isLoading && !macAddressesQuery.isError ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>MAC Address</th>
                    <th>System Description</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(macAddressesQuery.data?.mac_addresses ?? []).map((entry) => {
                    const isSelected = entry.mac_address === effectiveMacAddress;
                    return (
                      <tr key={entry.mac_address} className={isSelected ? "is-selected" : undefined}>
                        <td className="mono">{entry.mac_address}</td>
                        <td>{summarizeSystemDescription(entry.system_description)}</td>
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
        </Panel>

        <Panel title="Archive And Direct Download">
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
      </div>

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
                              <td>{summarizeSystemDescription(entry.system_description)}</td>
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
    </>
  );
}
