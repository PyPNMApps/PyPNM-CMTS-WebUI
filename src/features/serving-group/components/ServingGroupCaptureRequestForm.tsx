import { SecretTextInput } from "@/components/common/SecretTextInput";
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
}

interface ServingGroupCaptureRequestFormProps {
  baseUrl?: string;
  idPrefix?: string;
  onPayloadChange?: (payload: ServingGroupCaptureRequestPayload) => void;
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

function parseChannelIds(value: string): number[] {
  return value
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isInteger(entry));
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

export function ServingGroupCaptureRequestForm({
  baseUrl,
  idPrefix = "serving-group-capture-request",
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
  const [cableModemRows, setCableModemRows] = useState<CableModemRow[]>([]);
  const [selectedCableModems, setSelectedCableModems] = useState<string[]>([]);
  const [loadingCableModems, setLoadingCableModems] = useState(false);
  const [cableModemLoadError, setCableModemLoadError] = useState("");
  const [sortKey, setSortKey] = useState<CableModemSortKey>("registrationStatus");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterMode, setFilterMode] = useState<CableModemFilter>("all");

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
    const parsedChannelIds = parseChannelIds(channelIdsRaw);

    return {
      cmts: {
        serving_group: {
          id: selectedServingGroupIds,
        },
        cable_modem: {
          mac_address: selectedCableModems,
          pnm_parameters: {
            tftp: {
              ipv4: tftpIpv4.trim(),
              ipv6: tftpIpv6.trim(),
            },
            capture: {
              channel_ids: parsedChannelIds.length > 0 ? parsedChannelIds : [0],
            },
          },
          snmp: {
            snmpV2C: {
              community: community.trim(),
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
  }, [
    selectedServingGroupIds,
    selectedCableModems,
    channelIdsRaw,
    tftpIpv4,
    tftpIpv6,
    community,
    executionMaxWorkers,
    executionRetryCount,
    executionRetryDelaySeconds,
    executionPerModemTimeoutSeconds,
    executionOverallTimeoutSeconds,
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
    onPayloadChange?.(requestPayload);
  }, [requestPayload, onPayloadChange]);

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
          <div className="capture-request-group-heading"><h3>Serving Group Scope</h3></div>
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
        </section>

        <section className="chart-frame capture-request-group">
          <div className="capture-request-group-heading"><h3>Capture Parameters</h3></div>
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
          <div className="field">
            <label htmlFor={`${idPrefix}-channel-ids`}>Capture Channel IDs</label>
            <input
              id={`${idPrefix}-channel-ids`}
              value={channelIdsRaw}
              onChange={(event) => setChannelIdsRaw(event.target.value)}
              placeholder="0 = all channels"
            />
          </div>
          <div className="grid two">
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
        </section>
      </div>

      <section className="chart-frame capture-request-group">
        <div className="capture-request-group-heading"><h3>Cable Modems</h3></div>
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
      </section>
    </div>
  );
}
