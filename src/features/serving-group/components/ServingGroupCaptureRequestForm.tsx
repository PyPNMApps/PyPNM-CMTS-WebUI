import { SecretTextInput } from "@/components/common/SecretTextInput";
import {
  DEFAULT_SPECTRUM_ANALYZER_RETRIEVAL_TYPE,
  DEFAULT_SPECTRUM_ANALYZER_WINDOW_FUNCTION,
  SPECTRUM_ANALYZER_RETRIEVAL_TYPE_OPTIONS,
  SPECTRUM_ANALYZER_WINDOW_FUNCTION_OPTIONS,
} from "@/lib/spectrumAnalyzerEnumLookup";
import { validateAndNormalizeChannelIds } from "@/lib/channelIds";
import { requestWithBaseUrl } from "@/services/http";
import { useEffect, useMemo, useState } from "react";

export interface ServingGroupCaptureRequestPayload {
  cmts: {
    serving_group: {
      id: number[];
    };
    cable_modem: {
      mac_address: string[];
      pnm_parameters: {
        tftp: {
          ipv4: string;
          ipv6: string;
        };
        capture: {
          channel_ids: number[];
        };
      };
      snmp: {
        snmpV2C: {
          community: string;
        };
      };
    };
  };
  execution: {
    max_workers: number;
    retry_count: number;
    retry_delay_seconds: number;
    per_modem_timeout_seconds: number;
    overall_timeout_seconds: number;
  };
  capture_settings?: {
    fec_summary_type?: number;
    modulation_order_offset?: number;
    number_sample_symbol?: number;
    sample_duration?: number;
    inactivity_timeout?: number;
    first_segment_center_freq?: number;
    last_segment_center_freq?: number;
    resolution_bw?: number;
    noise_bw?: number;
    window_function?: number;
    num_averages?: number;
    spectrum_retrieval_type?: number;
  };
}

export const FEC_SUMMARY_TYPE_OPTIONS = [
  { value: 3, label: "24 Hours" },
  { value: 2, label: "10 Min" },
] as const;

interface ServingGroupCaptureRequestFormProps {
  baseUrl?: string;
  idPrefix?: string;
  initialSnmpCommunity?: string;
  initialTftpIpv4?: string;
  initialTftpIpv6?: string;
  captureSettingsMode?: "none" | "fec-summary" | "constellation-display" | "histogram" | "spectrum-friendly";
  onPayloadChange?: (payload: ServingGroupCaptureRequestPayload | null) => void;
}

interface CableModemListItem {
  mac_address?: string;
  sysdescr?: {
    VENDOR?: string;
    MODEL?: string;
  };
  registration_status?: {
    status?: number;
    text?: string;
  };
}

interface CableModemListGroup {
  sg_id?: number;
  items?: CableModemListItem[];
}

interface CableModemListResponse {
  groups?: CableModemListGroup[];
}

interface FieldLabelWithHintProps {
  htmlFor: string;
  label: string;
  hint: string;
}

interface CableModemRow {
  macAddress: string;
  vendor: string;
  model: string;
  registrationStatusText: string;
  registrationStatusCode: number | null;
}

type RegistrationStatusTone = "operational" | "non_operational";
type CableModemSortKey = "registrationStatus" | "vendor" | "model";
type SortDirection = "asc" | "desc";
type CableModemFilter = "all" | "operational";

function collectServingGroupIds(source: unknown, output: Set<number>) {
  if (Array.isArray(source)) {
    for (const item of source) {
      collectServingGroupIds(item, output);
    }
    return;
  }

  if (!source || typeof source !== "object") {
    return;
  }

  const record = source as Record<string, unknown>;
  const candidates = [record.sg_id, record.serving_group_id, record.servingGroupId];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isInteger(candidate)) {
      output.add(candidate);
      continue;
    }
    if (typeof candidate === "string") {
      const parsed = Number.parseInt(candidate.trim(), 10);
      if (Number.isInteger(parsed)) {
        output.add(parsed);
      }
    }
  }

  for (const value of Object.values(record)) {
    collectServingGroupIds(value, output);
  }
}

function parsePositiveInteger(value: string, fallback: number): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInteger(value: string, fallback: number): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeCableModemRows(response: CableModemListResponse): CableModemRow[] {
  const rows: CableModemRow[] = [];
  const seenMacs = new Set<string>();
  for (const group of response.groups ?? []) {
    for (const item of group.items ?? []) {
      const macAddress = String(item.mac_address ?? "").trim().toLowerCase();
      if (!macAddress || seenMacs.has(macAddress)) {
        continue;
      }
      seenMacs.add(macAddress);
      const registrationText = String(item.registration_status?.text ?? "").trim();
      const registrationCode = typeof item.registration_status?.status === "number" ? item.registration_status.status : null;
      rows.push({
        macAddress,
        vendor: String(item.sysdescr?.VENDOR ?? "").trim() || "n/a",
        model: String(item.sysdescr?.MODEL ?? "").trim() || "n/a",
        registrationStatusText: registrationText || "n/a",
        registrationStatusCode: registrationCode,
      });
    }
  }
  return rows.sort((left, right) => left.macAddress.localeCompare(right.macAddress));
}

function toRegistrationStatusTone(statusText: string, statusCode: number | null): RegistrationStatusTone {
  if (statusCode === 8 || statusText.trim().toLowerCase() === "operational") {
    return "operational";
  }
  return "non_operational";
}

function FieldLabelWithHint({ htmlFor, label, hint }: FieldLabelWithHintProps) {
  return (
    <label htmlFor={htmlFor} className="field-label field-label-with-hint">
      <span>{label}</span>
      <span className="field-hint" title={hint} aria-label={`${label} help`}>?</span>
    </label>
  );
}

export function ServingGroupCaptureRequestForm({
  baseUrl,
  idPrefix = "serving-group-capture-request",
  initialSnmpCommunity = "",
  initialTftpIpv4 = "",
  initialTftpIpv6 = "",
  captureSettingsMode = "none",
  onPayloadChange,
}: ServingGroupCaptureRequestFormProps) {
  const [availableServingGroupIds, setAvailableServingGroupIds] = useState<number[]>([]);
  const [selectedServingGroupIds, setSelectedServingGroupIds] = useState<number[]>([]);
  const [loadingServingGroups, setLoadingServingGroups] = useState(false);
  const [servingGroupLoadError, setServingGroupLoadError] = useState("");

  const [channelIdsRaw, setChannelIdsRaw] = useState("0");
  const [tftpIpv4, setTftpIpv4] = useState("");
  const [tftpIpv6, setTftpIpv6] = useState("");
  const [community, setCommunity] = useState("");
  const [executionMaxWorkers, setExecutionMaxWorkers] = useState("16");
  const [executionRetryCount, setExecutionRetryCount] = useState("3");
  const [executionRetryDelaySeconds, setExecutionRetryDelaySeconds] = useState("5");
  const [executionPerModemTimeoutSeconds, setExecutionPerModemTimeoutSeconds] = useState("30");
  const [executionOverallTimeoutSeconds, setExecutionOverallTimeoutSeconds] = useState("120");
  const [fecSummaryType, setFecSummaryType] = useState<number>(2);
  const [modulationOrderOffset, setModulationOrderOffset] = useState("0");
  const [numberSampleSymbol, setNumberSampleSymbol] = useState("8192");
  const [sampleDuration, setSampleDuration] = useState("10");
  const [inactivityTimeout, setInactivityTimeout] = useState("60");
  const [firstSegmentCenterFreq, setFirstSegmentCenterFreq] = useState("300000000");
  const [lastSegmentCenterFreq, setLastSegmentCenterFreq] = useState("900000000");
  const [resolutionBw, setResolutionBw] = useState("30000");
  const [noiseBw, setNoiseBw] = useState("150");
  const [windowFunction, setWindowFunction] = useState(String(DEFAULT_SPECTRUM_ANALYZER_WINDOW_FUNCTION));
  const [numAverages, setNumAverages] = useState("1");
  const [spectrumRetrievalType, setSpectrumRetrievalType] = useState(String(DEFAULT_SPECTRUM_ANALYZER_RETRIEVAL_TYPE));
  const [cableModemRows, setCableModemRows] = useState<CableModemRow[]>([]);
  const [selectedCableModems, setSelectedCableModems] = useState<string[]>([]);
  const [loadingCableModems, setLoadingCableModems] = useState(false);
  const [cableModemLoadError, setCableModemLoadError] = useState("");
  const [sortKey, setSortKey] = useState<CableModemSortKey>("registrationStatus");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterMode, setFilterMode] = useState<CableModemFilter>("all");
  const channelIdValidation = useMemo(() => validateAndNormalizeChannelIds(channelIdsRaw), [channelIdsRaw]);

  useEffect(() => {
    setCommunity(initialSnmpCommunity.trim());
  }, [initialSnmpCommunity]);

  useEffect(() => {
    setTftpIpv4(initialTftpIpv4.trim());
  }, [initialTftpIpv4]);

  useEffect(() => {
    setTftpIpv6(initialTftpIpv6.trim());
  }, [initialTftpIpv6]);

  useEffect(() => {
    let cancelled = false;

    async function loadServingGroups() {
      if (!baseUrl) {
        setAvailableServingGroupIds([]);
        setSelectedServingGroupIds([]);
        setServingGroupLoadError("");
        return;
      }

      setLoadingServingGroups(true);
      setServingGroupLoadError("");
      try {
        const response = await requestWithBaseUrl<unknown>(baseUrl, {
          method: "GET",
          url: "/ops/servingGroupWorker/process",
        });
        if (cancelled) {
          return;
        }
        const foundIds = new Set<number>();
        collectServingGroupIds(response.data, foundIds);
        const nextIds = [...foundIds].sort((left, right) => left - right);
        setAvailableServingGroupIds(nextIds);
        setSelectedServingGroupIds(nextIds);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load serving groups.";
          setServingGroupLoadError(message);
          setAvailableServingGroupIds([]);
          setSelectedServingGroupIds([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingServingGroups(false);
        }
      }
    }

    void loadServingGroups();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadCableModems() {
      if (!baseUrl) {
        setCableModemRows([]);
        setSelectedCableModems([]);
        setCableModemLoadError("");
        return;
      }

      // Clear stale rows as soon as SG scope changes so users cannot
      // select MACs that belong to a previous SG selection.
      setCableModemRows([]);
      setSelectedCableModems([]);
      setLoadingCableModems(true);
      setCableModemLoadError("");
      try {
        const response = await requestWithBaseUrl<CableModemListResponse>(baseUrl, {
          method: "POST",
          url: "/cmts/servingGroup/operations/get/cableModems",
          data: {
            cmts: {
              serving_group: {
                id: selectedServingGroupIds,
              },
            },
            refresh: {
              mode: "light",
              wait_for_cache: false,
              timeout_seconds: 8,
            },
          },
        });
        if (cancelled) {
          return;
        }
        const rows = normalizeCableModemRows(response.data);
        const defaultSelection = rows.map((entry) => entry.macAddress);
        setCableModemRows(rows);
        setSelectedCableModems(defaultSelection);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load cable modems.";
          setCableModemLoadError(message);
          setCableModemRows([]);
          setSelectedCableModems([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCableModems(false);
        }
      }
    }

    void loadCableModems();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, selectedServingGroupIds]);

  const requestPayload = useMemo<ServingGroupCaptureRequestPayload>(() => {
    const parsedChannelIds = channelIdValidation.channelIds;
    const allServingGroupsSelected = availableServingGroupIds.length > 0
      && selectedServingGroupIds.length === availableServingGroupIds.length
      && availableServingGroupIds.every((servingGroupId) => selectedServingGroupIds.includes(servingGroupId));
    const allCableModemsSelected = cableModemRows.length > 0
      && selectedCableModems.length === cableModemRows.length
      && cableModemRows.every((row) => selectedCableModems.includes(row.macAddress));
    const servingGroupIdsForRequest = allServingGroupsSelected ? [] : selectedServingGroupIds;
    const cableModemsForRequest = allCableModemsSelected ? [] : selectedCableModems;

    const payload: ServingGroupCaptureRequestPayload = {
      cmts: {
        serving_group: {
          id: servingGroupIdsForRequest,
        },
        cable_modem: {
          mac_address: cableModemsForRequest,
          pnm_parameters: {
            tftp: {
              ipv4: tftpIpv4.trim(),
              ipv6: tftpIpv6.trim(),
            },
            capture: {
              channel_ids: parsedChannelIds,
            },
          },
          snmp: {
            snmpV2C: {
              community: community.trim() || "private",
            },
          },
        },
      },
      execution: {
        max_workers: parsePositiveInteger(executionMaxWorkers, 16),
        retry_count: parseNonNegativeInteger(executionRetryCount, 3),
        retry_delay_seconds: parseNonNegativeInteger(executionRetryDelaySeconds, 5),
        per_modem_timeout_seconds: parsePositiveInteger(executionPerModemTimeoutSeconds, 30),
        overall_timeout_seconds: parsePositiveInteger(executionOverallTimeoutSeconds, 120),
      },
    };
    if (captureSettingsMode === "fec-summary") {
      payload.capture_settings = {
        fec_summary_type: fecSummaryType,
      };
    }
    if (captureSettingsMode === "constellation-display") {
      payload.capture_settings = {
        modulation_order_offset: parseNonNegativeInteger(modulationOrderOffset, 0),
        number_sample_symbol: parsePositiveInteger(numberSampleSymbol, 8192),
      };
    }
    if (captureSettingsMode === "histogram") {
      payload.capture_settings = {
        sample_duration: parsePositiveInteger(sampleDuration, 10),
      };
    }
    if (captureSettingsMode === "spectrum-friendly") {
      payload.capture_settings = {
        inactivity_timeout: parsePositiveInteger(inactivityTimeout, 60),
        first_segment_center_freq: parsePositiveInteger(firstSegmentCenterFreq, 300000000),
        last_segment_center_freq: parsePositiveInteger(lastSegmentCenterFreq, 900000000),
        resolution_bw: parsePositiveInteger(resolutionBw, 30000),
        noise_bw: parseNonNegativeInteger(noiseBw, 150),
        window_function: parseNonNegativeInteger(windowFunction, DEFAULT_SPECTRUM_ANALYZER_WINDOW_FUNCTION),
        num_averages: parsePositiveInteger(numAverages, 1),
        spectrum_retrieval_type: parseNonNegativeInteger(spectrumRetrievalType, DEFAULT_SPECTRUM_ANALYZER_RETRIEVAL_TYPE),
      };
    }
    return payload;
  }, [
    availableServingGroupIds,
    cableModemRows,
    channelIdValidation.channelIds,
    selectedServingGroupIds,
    selectedCableModems,
    tftpIpv4,
    tftpIpv6,
    community,
    executionMaxWorkers,
    executionRetryCount,
    executionRetryDelaySeconds,
    executionPerModemTimeoutSeconds,
    executionOverallTimeoutSeconds,
    captureSettingsMode,
    fecSummaryType,
    modulationOrderOffset,
    numberSampleSymbol,
    sampleDuration,
    inactivityTimeout,
    firstSegmentCenterFreq,
    lastSegmentCenterFreq,
    resolutionBw,
    noiseBw,
    windowFunction,
    numAverages,
    spectrumRetrievalType,
  ]);

  const sortedCableModemRows = useMemo(() => {
    const next = [...cableModemRows];
    next.sort((left, right) => {
      const leftValue = sortKey === "registrationStatus"
        ? left.registrationStatusText
        : (sortKey === "vendor" ? left.vendor : left.model);
      const rightValue = sortKey === "registrationStatus"
        ? right.registrationStatusText
        : (sortKey === "vendor" ? right.vendor : right.model);
      const normalizedLeft = leftValue.toLowerCase();
      const normalizedRight = rightValue.toLowerCase();
      const byKey = normalizedLeft.localeCompare(normalizedRight);
      if (byKey !== 0) {
        return sortDirection === "asc" ? byKey : -byKey;
      }
      return left.macAddress.localeCompare(right.macAddress);
    });
    return next;
  }, [cableModemRows, sortKey, sortDirection]);

  const visibleCableModemRows = useMemo(() => {
    if (filterMode === "all") {
      return sortedCableModemRows;
    }
    return sortedCableModemRows.filter((row) => toRegistrationStatusTone(row.registrationStatusText, row.registrationStatusCode) === "operational");
  }, [sortedCableModemRows, filterMode]);

  useEffect(() => {
    if (channelIdValidation.error) {
      onPayloadChange?.(null);
      return;
    }
    onPayloadChange?.(requestPayload);
  }, [channelIdValidation.error, onPayloadChange, requestPayload]);

  function toggleServingGroupId(servingGroupId: number) {
    setSelectedServingGroupIds((current) => {
      const alreadySelected = current.includes(servingGroupId);
      if (alreadySelected) {
        return current.filter((entry) => entry !== servingGroupId);
      }
      return [...current, servingGroupId].sort((left, right) => left - right);
    });
  }

  function toggleCableModem(macAddress: string) {
    setSelectedCableModems((current) => {
      const isSelected = current.includes(macAddress);
      return isSelected
        ? current.filter((entry) => entry !== macAddress)
        : [...current, macAddress].sort((left, right) => left.localeCompare(right));
    });
  }

  function toggleSort(nextKey: CableModemSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function sortIndicator(key: CableModemSortKey): string {
    if (sortKey !== key) {
      return "";
    }
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="capture-request-groups">
      <div className="capture-request-top-grid">
        <section className="chart-frame capture-request-group">
          <details className="capture-request-dropdown">
            <summary className="capture-request-dropdown-summary">
              <span>Serving Group Scope</span>
            </summary>
            <div className="field">
              <label>Serving Group IDs</label>
              <div className="status-chip-row">
                <button
                  type="button"
                  className="analysis-chip-button"
                  disabled={availableServingGroupIds.length === 0}
                  onClick={() => setSelectedServingGroupIds([...availableServingGroupIds])}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="analysis-chip-button"
                  disabled={selectedServingGroupIds.length === 0}
                  onClick={() => setSelectedServingGroupIds([])}
                >
                  Unselect All
                </button>
              </div>
              <div className="status-chip-row">
                {availableServingGroupIds.map((servingGroupId) => {
                  const isSelected = selectedServingGroupIds.includes(servingGroupId);
                  return (
                    <button
                      key={servingGroupId}
                      type="button"
                      className={isSelected ? "analysis-chip-button active" : "analysis-chip-button"}
                      onClick={() => toggleServingGroupId(servingGroupId)}
                    >
                      SG {servingGroupId}
                    </button>
                  );
                })}
              </div>
              <p className="panel-copy">
                {loadingServingGroups ? "Loading SG IDs..." : null}
                {!loadingServingGroups && availableServingGroupIds.length === 0 && !servingGroupLoadError
                  ? "No active SG IDs found. Leaving this empty means all serving groups."
                  : null}
                {servingGroupLoadError ? `Failed to load SG IDs: ${servingGroupLoadError}` : null}
              </p>
            </div>
          </details>
        </section>

        <section className="chart-frame capture-request-group">
          <details className="capture-request-dropdown">
            <summary className="capture-request-dropdown-summary">
              <span>Capture Parameters</span>
            </summary>
            <div className="field">
              <label htmlFor={`${idPrefix}-channel-ids`}>Capture Channel IDs</label>
              <input
                id={`${idPrefix}-channel-ids`}
                value={channelIdsRaw}
                onChange={(event) => setChannelIdsRaw(event.target.value)}
                placeholder="Enter channel IDs; 0 alone means all channels"
              />
              {channelIdValidation.error ? (
                <p className="advanced-error-text">{channelIdValidation.error}</p>
              ) : null}
            </div>
            <div className="capture-request-common-grid">
              <div className="field capture-request-compact-input">
                <label htmlFor={`${idPrefix}-community`}>SNMP v2c Community</label>
                <SecretTextInput
                  id={`${idPrefix}-community`}
                  value={community}
                  onChange={(event) => setCommunity(event.target.value)}
                  placeholder="private"
                  autoComplete="off"
                />
              </div>
              <div className="field capture-request-compact-input">
                <label htmlFor={`${idPrefix}-tftp-ipv4`}>TFTP IPv4</label>
                <input
                  id={`${idPrefix}-tftp-ipv4`}
                  value={tftpIpv4}
                  onChange={(event) => setTftpIpv4(event.target.value)}
                  placeholder="172.19.8.28"
                />
              </div>
              <div className="field capture-request-compact-input">
                <label htmlFor={`${idPrefix}-tftp-ipv6`}>TFTP IPv6</label>
                <input
                  id={`${idPrefix}-tftp-ipv6`}
                  value={tftpIpv6}
                  onChange={(event) => setTftpIpv6(event.target.value)}
                  placeholder="::"
                />
              </div>
            </div>
            {captureSettingsMode === "fec-summary" ? (
              <div className="capture-request-mode-grid">
                <div className="field capture-request-compact-input">
                  <label htmlFor={`${idPrefix}-fec-summary-type`}>FEC Summary Type</label>
                  <select
                    id={`${idPrefix}-fec-summary-type`}
                    value={String(fecSummaryType)}
                    onChange={(event) => setFecSummaryType(Number.parseInt(event.target.value, 10) || 2)}
                  >
                    {FEC_SUMMARY_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
            {captureSettingsMode === "constellation-display" ? (
              <div className="capture-request-mode-grid">
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-modulation-order-offset`}
                    label="Modulation Order Offset"
                    hint="Offset applied to the requested constellation modulation order index. Use 0 for the baseline capture mode."
                  />
                  <input
                    id={`${idPrefix}-modulation-order-offset`}
                    type="number"
                    min={0}
                    value={modulationOrderOffset}
                    onChange={(event) => setModulationOrderOffset(event.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-number-sample-symbol`}
                    label="Number Sample Symbol"
                    hint="Number of constellation symbols to collect per modem during capture. Higher values increase sample density and payload size."
                  />
                  <input
                    id={`${idPrefix}-number-sample-symbol`}
                    type="number"
                    min={1}
                    value={numberSampleSymbol}
                    onChange={(event) => setNumberSampleSymbol(event.target.value)}
                    placeholder="8192"
                  />
                </div>
              </div>
            ) : null}
            {captureSettingsMode === "histogram" ? (
              <div className="capture-request-mode-grid">
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-sample-duration`}
                    label="Sample Duration"
                    hint="Histogram sample duration in seconds for each modem capture."
                  />
                  <input
                    id={`${idPrefix}-sample-duration`}
                    type="number"
                    min={1}
                    value={sampleDuration}
                    onChange={(event) => setSampleDuration(event.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>
            ) : null}
            {captureSettingsMode === "spectrum-friendly" ? (
              <div className="capture-request-mode-grid">
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-inactivity-timeout`}
                    label="Inactivity Timeout"
                    hint="Maximum inactivity timeout in seconds before spectrum capture stops."
                  />
                  <input
                    id={`${idPrefix}-inactivity-timeout`}
                    type="number"
                    min={1}
                    value={inactivityTimeout}
                    onChange={(event) => setInactivityTimeout(event.target.value)}
                    placeholder="60"
                  />
                </div>
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-first-segment-center-freq`}
                    label="First Segment Center Freq"
                    hint="First segment center frequency in Hz."
                  />
                  <input
                    id={`${idPrefix}-first-segment-center-freq`}
                    type="number"
                    min={1}
                    value={firstSegmentCenterFreq}
                    onChange={(event) => setFirstSegmentCenterFreq(event.target.value)}
                    placeholder="300000000"
                  />
                </div>
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-last-segment-center-freq`}
                    label="Last Segment Center Freq"
                    hint="Last segment center frequency in Hz."
                  />
                  <input
                    id={`${idPrefix}-last-segment-center-freq`}
                    type="number"
                    min={1}
                    value={lastSegmentCenterFreq}
                    onChange={(event) => setLastSegmentCenterFreq(event.target.value)}
                    placeholder="900000000"
                  />
                </div>
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-resolution-bw`}
                    label="Resolution BW"
                    hint="Spectrum analyzer resolution bandwidth in Hz."
                  />
                  <input
                    id={`${idPrefix}-resolution-bw`}
                    type="number"
                    min={1}
                    value={resolutionBw}
                    onChange={(event) => setResolutionBw(event.target.value)}
                    placeholder="30000"
                  />
                </div>
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-noise-bw`}
                    label="Noise BW"
                    hint="Equivalent noise bandwidth in kHz."
                  />
                  <input
                    id={`${idPrefix}-noise-bw`}
                    type="number"
                    min={0}
                    value={noiseBw}
                    onChange={(event) => setNoiseBw(event.target.value)}
                    placeholder="150"
                  />
                </div>
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-window-function`}
                    label="Window Function"
                    hint="FFT window function enum lookup used by the CMTS backend."
                  />
                  <select
                    id={`${idPrefix}-window-function`}
                    value={windowFunction}
                    onChange={(event) => setWindowFunction(event.target.value)}
                  >
                    {SPECTRUM_ANALYZER_WINDOW_FUNCTION_OPTIONS.map((option) => (
                      <option key={option.value} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-num-averages`}
                    label="Num Averages"
                    hint="Number of averages used during spectrum capture."
                  />
                  <input
                    id={`${idPrefix}-num-averages`}
                    type="number"
                    min={1}
                    value={numAverages}
                    onChange={(event) => setNumAverages(event.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="field capture-request-compact-input">
                  <FieldLabelWithHint
                    htmlFor={`${idPrefix}-spectrum-retrieval-type`}
                    label="Spectrum Retrieval Type"
                    hint="Spectrum retrieval type enum lookup used by the backend."
                  />
                  <select
                    id={`${idPrefix}-spectrum-retrieval-type`}
                    value={spectrumRetrievalType}
                    onChange={(event) => setSpectrumRetrievalType(event.target.value)}
                  >
                    {SPECTRUM_ANALYZER_RETRIEVAL_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
            <details className="capture-request-dropdown">
              <summary className="capture-request-dropdown-summary">
                <span>Execution</span>
                <span className="capture-request-group-meta">Defaults from PW baseline</span>
              </summary>
              <div className="grid two">
                <div className="field">
                  <label htmlFor={`${idPrefix}-execution-max-workers`}>Max Workers</label>
                  <input
                    id={`${idPrefix}-execution-max-workers`}
                    type="number"
                    min={1}
                    value={executionMaxWorkers}
                    onChange={(event) => setExecutionMaxWorkers(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`${idPrefix}-execution-retry-count`}>Retry Count</label>
                  <input
                    id={`${idPrefix}-execution-retry-count`}
                    type="number"
                    min={0}
                    value={executionRetryCount}
                    onChange={(event) => setExecutionRetryCount(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`${idPrefix}-execution-retry-delay`}>Retry Delay Seconds</label>
                  <input
                    id={`${idPrefix}-execution-retry-delay`}
                    type="number"
                    min={0}
                    value={executionRetryDelaySeconds}
                    onChange={(event) => setExecutionRetryDelaySeconds(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`${idPrefix}-execution-per-modem-timeout`}>Per-Modem Timeout Seconds</label>
                  <input
                    id={`${idPrefix}-execution-per-modem-timeout`}
                    type="number"
                    min={1}
                    value={executionPerModemTimeoutSeconds}
                    onChange={(event) => setExecutionPerModemTimeoutSeconds(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`${idPrefix}-execution-overall-timeout`}>Overall Timeout Seconds</label>
                  <input
                    id={`${idPrefix}-execution-overall-timeout`}
                    type="number"
                    min={1}
                    value={executionOverallTimeoutSeconds}
                    onChange={(event) => setExecutionOverallTimeoutSeconds(event.target.value)}
                  />
                </div>
              </div>
            </details>
          </details>
        </section>
      </div>

      <section className="chart-frame capture-request-group">
        <details className="capture-request-dropdown">
          <summary className="capture-request-dropdown-summary">
            <span>Cable Modems</span>
          </summary>
          <div className="field">
          <div className="capture-request-modem-toolbar">
            <div className="capture-request-modem-toolbar-main">
              <span className="capture-request-modem-toolbar-label">Cable Modem Selection</span>
              <div className="capture-request-selection-summary">
                Selected {selectedCableModems.length} of {cableModemRows.length}
              </div>
            </div>
            <div className="capture-request-filter-tabs">
              <button
                type="button"
                className={filterMode === "all" ? "analysis-chip-button active" : "analysis-chip-button"}
                onClick={() => setFilterMode("all")}
              >
                All
              </button>
              <button
                type="button"
                className={filterMode === "operational" ? "analysis-chip-button active" : "analysis-chip-button"}
                onClick={() => setFilterMode("operational")}
              >
                Operational Only
              </button>
            </div>
            <div className="capture-request-table-actions">
              <button
                type="button"
                className="analysis-chip-button"
                disabled={visibleCableModemRows.length === 0}
                onClick={() => {
                  const visible = visibleCableModemRows.map((entry) => entry.macAddress);
                  setSelectedCableModems(visible);
                }}
              >
                Select All
              </button>
              <button
                type="button"
                className="analysis-chip-button"
                disabled={selectedCableModems.length === 0}
                onClick={() => {
                  setSelectedCableModems([]);
                }}
              >
                Unselect All
              </button>
            </div>
          </div>
          {loadingCableModems ? <p className="panel-copy">Loading cable modems (light poll)...</p> : null}
          {cableModemLoadError ? <p className="panel-copy">Failed to load cable modems: {cableModemLoadError}</p> : null}
          {!loadingCableModems && !cableModemLoadError && cableModemRows.length === 0
            ? <p className="panel-copy">No cable modems returned for selected serving groups.</p>
            : null}
            {cableModemRows.length > 0 ? (
              <div className="table-wrap capture-request-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>
                      <button type="button" className="analysis-chip-button" onClick={() => toggleSort("registrationStatus")}>
                        Registration Status{sortIndicator("registrationStatus")}
                      </button>
                    </th>
                    <th>MAC Address</th>
                    <th>
                      <button type="button" className="analysis-chip-button" onClick={() => toggleSort("vendor")}>
                        Vendor{sortIndicator("vendor")}
                      </button>
                    </th>
                    <th>
                      <button type="button" className="analysis-chip-button" onClick={() => toggleSort("model")}>
                        Model{sortIndicator("model")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCableModemRows.map((row) => (
                    <tr key={row.macAddress}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCableModems.includes(row.macAddress)}
                          onChange={() => toggleCableModem(row.macAddress)}
                          aria-label={`Select cable modem ${row.macAddress}`}
                        />
                      </td>
                      <td>
                        <span className={`capture-status-chip ${toRegistrationStatusTone(row.registrationStatusText, row.registrationStatusCode) === "operational" ? "online" : "offline"}`}>
                          {row.registrationStatusText}
                        </span>
                      </td>
                      <td className="mono">{row.macAddress}</td>
                      <td>{row.vendor}</td>
                      <td>{row.model}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : null}
          </div>
        </details>
      </section>
    </div>
  );
}
