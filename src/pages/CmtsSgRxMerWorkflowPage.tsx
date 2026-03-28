import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { useInstanceConfig } from "@/app/useInstanceConfig";
import { requestWithBaseUrl } from "@/services/http";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

const servingGroupRoutes = [
  { to: "/serving-group/rxmer", label: "RxMER" },
] as const;

interface CaptureRequestPayload {
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
  const candidates = [
    record.sg_id,
    record.serving_group_id,
    record.servingGroupId,
  ];

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

export function CmtsSgRxMerWorkflowPage() {
  const { selectedInstance } = useInstanceConfig();
  const [availableServingGroupIds, setAvailableServingGroupIds] = useState<number[]>([]);
  const [selectedServingGroupIds, setSelectedServingGroupIds] = useState<number[]>([]);
  const [loadingServingGroups, setLoadingServingGroups] = useState(false);
  const [servingGroupLoadError, setServingGroupLoadError] = useState("");

  const [macAddresses, setMacAddresses] = useState("");
  const [channelIds, setChannelIds] = useState("0");
  const [tftpIpv4, setTftpIpv4] = useState("");
  const [tftpIpv6, setTftpIpv6] = useState("");
  const [community, setCommunity] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadServingGroups() {
      if (!selectedInstance?.baseUrl) {
        setAvailableServingGroupIds([]);
        setSelectedServingGroupIds([]);
        setServingGroupLoadError("");
        return;
      }

      setLoadingServingGroups(true);
      setServingGroupLoadError("");
      try {
        const response = await requestWithBaseUrl<unknown>(selectedInstance.baseUrl, {
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
  }, [selectedInstance?.baseUrl]);

  const requestPayload = useMemo<CaptureRequestPayload>(() => {
    const parsedMacAddresses = macAddresses
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const parsedChannelIds = channelIds
      .split(",")
      .map((entry) => Number.parseInt(entry.trim(), 10))
      .filter((entry) => Number.isInteger(entry));

    return {
      cmts: {
        serving_group: {
          id: selectedServingGroupIds,
        },
        cable_modem: {
          mac_address: parsedMacAddresses,
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
        max_workers: 16,
        retry_count: 3,
        retry_delay_seconds: 5,
        per_modem_timeout_seconds: 30,
        overall_timeout_seconds: 120,
      },
    };
  }, [selectedServingGroupIds, macAddresses, channelIds, tftpIpv4, tftpIpv6, community]);

  function toggleServingGroupId(servingGroupId: number) {
    setSelectedServingGroupIds((current) => {
      const alreadySelected = current.includes(servingGroupId);
      if (alreadySelected) {
        return current.filter((entry) => entry !== servingGroupId);
      }
      return [...current, servingGroupId].sort((left, right) => left - right);
    });
  }

  return (
    <>
      <nav className="advanced-subnav">
        {servingGroupRoutes.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <PageHeader
        title="CMTS SG Downstream OFDM RxMER"
        subtitle="Capture Request form. SG IDs come from the active serving-group worker process."
      />
      <Panel title="Capture Request">
        <div className="capture-request-groups">
          <section className="chart-frame capture-request-group">
            <div className="capture-request-group-heading">
              <h3>cmts.serving_group</h3>
              <span className="capture-request-group-meta">Select SG IDs from worker process</span>
            </div>
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
            <div className="capture-request-group-heading">
              <h3>cmts.cable_modem</h3>
            </div>
            <div className="grid">
              <div className="field">
                <label htmlFor="cmts-sg-rxmer-mac-addresses">MAC Addresses</label>
                <input
                  id="cmts-sg-rxmer-mac-addresses"
                  value={macAddresses}
                  onChange={(event) => setMacAddresses(event.target.value)}
                  placeholder="empty = all cable modems"
                />
              </div>
              <div className="field">
                <label htmlFor="cmts-sg-rxmer-community">SNMP v2c Community</label>
                <input
                  id="cmts-sg-rxmer-community"
                  value={community}
                  onChange={(event) => setCommunity(event.target.value)}
                  placeholder="private"
                />
              </div>
            </div>
          </section>

          <section className="chart-frame capture-request-group capture-request-group-nested">
            <div className="capture-request-group-heading">
              <h3>cmts.cable_modem.pnm_parameters</h3>
            </div>
            <div className="grid">
              <div className="field">
                <label htmlFor="cmts-sg-rxmer-channel-ids">Capture Channel IDs</label>
                <input
                  id="cmts-sg-rxmer-channel-ids"
                  value={channelIds}
                  onChange={(event) => setChannelIds(event.target.value)}
                  placeholder="0 = all channels"
                />
              </div>
              <div className="field">
                <label htmlFor="cmts-sg-rxmer-tftp-ipv4">TFTP IPv4</label>
                <input
                  id="cmts-sg-rxmer-tftp-ipv4"
                  value={tftpIpv4}
                  onChange={(event) => setTftpIpv4(event.target.value)}
                  placeholder="172.19.8.28"
                />
              </div>
              <div className="field">
                <label htmlFor="cmts-sg-rxmer-tftp-ipv6">TFTP IPv6</label>
                <input
                  id="cmts-sg-rxmer-tftp-ipv6"
                  value={tftpIpv6}
                  onChange={(event) => setTftpIpv6(event.target.value)}
                  placeholder="::"
                />
              </div>
            </div>
          </section>

          <section className="chart-frame capture-request-group">
            <div className="capture-request-group-heading">
              <h3>execution</h3>
              <span className="capture-request-group-meta">Defaults from PW baseline</span>
            </div>
            <div className="status-chip-row">
              <span className="analysis-chip"><b>max_workers</b> 16</span>
              <span className="analysis-chip"><b>retry_count</b> 3</span>
              <span className="analysis-chip"><b>retry_delay_seconds</b> 5</span>
              <span className="analysis-chip"><b>per_modem_timeout_seconds</b> 30</span>
              <span className="analysis-chip"><b>overall_timeout_seconds</b> 120</span>
            </div>
          </section>

          <section className="field">
            <label htmlFor="cmts-sg-rxmer-request-json">Request JSON</label>
            <textarea
              id="cmts-sg-rxmer-request-json"
              className="mono"
              value={`${JSON.stringify(requestPayload, null, 2)}\n`}
              readOnly
              rows={20}
            />
          </section>
        </div>
      </Panel>
    </>
  );
}
