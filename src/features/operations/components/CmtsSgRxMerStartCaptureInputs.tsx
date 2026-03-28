import { useEffect, useMemo, useState } from "react";

interface CmtsSgRxMerStartCaptureInputsProps {
  payload: string;
  onPayloadChange: (nextPayload: string) => void;
  workflowId: string;
}

interface StartCaptureFormValues {
  servingGroupIds: string;
  macAddresses: string;
  tftpIpv4: string;
  tftpIpv6: string;
  channelIds: string;
  community: string;
  maxWorkers: string;
  retryCount: string;
  retryDelaySeconds: string;
  perModemTimeoutSeconds: string;
  overallTimeoutSeconds: string;
}

interface StartCapturePayloadModel {
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

const defaultFormValues: StartCaptureFormValues = {
  servingGroupIds: "",
  macAddresses: "",
  tftpIpv4: "",
  tftpIpv6: "",
  channelIds: "0",
  community: "",
  maxWorkers: "16",
  retryCount: "3",
  retryDelaySeconds: "5",
  perModemTimeoutSeconds: "30",
  overallTimeoutSeconds: "120",
};

function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function parseIntegerList(value: string): number[] {
  return value
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isInteger(entry));
}

function parseStringList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseIntOrDefault(value: string, fallback: number): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function toCsv(values: Array<string | number>): string {
  return values.join(", ");
}

function buildPayloadFromForm(values: StartCaptureFormValues): StartCapturePayloadModel {
  const parsedServingGroupIds = parseIntegerList(values.servingGroupIds);
  const parsedMacAddresses = parseStringList(values.macAddresses);
  const parsedChannelIds = parseIntegerList(values.channelIds);

  return {
    cmts: {
      serving_group: {
        id: parsedServingGroupIds,
      },
      cable_modem: {
        mac_address: parsedMacAddresses,
        pnm_parameters: {
          tftp: {
            ipv4: values.tftpIpv4.trim(),
            ipv6: values.tftpIpv6.trim(),
          },
          capture: {
            channel_ids: parsedChannelIds.length > 0 ? parsedChannelIds : [0],
          },
        },
        snmp: {
          snmpV2C: {
            community: values.community.trim(),
          },
        },
      },
    },
    execution: {
      max_workers: parseIntOrDefault(values.maxWorkers, 16),
      retry_count: parseIntOrDefault(values.retryCount, 3),
      retry_delay_seconds: parseIntOrDefault(values.retryDelaySeconds, 5),
      per_modem_timeout_seconds: parseIntOrDefault(values.perModemTimeoutSeconds, 30),
      overall_timeout_seconds: parseIntOrDefault(values.overallTimeoutSeconds, 120),
    },
  };
}

function parsePayloadToForm(rawPayload: string): StartCaptureFormValues {
  try {
    const parsed = JSON.parse(rawPayload) as Record<string, unknown>;
    const cmts = (parsed.cmts as Record<string, unknown> | undefined) ?? {};
    const servingGroup = (cmts.serving_group as Record<string, unknown> | undefined) ?? {};
    const cableModem = (cmts.cable_modem as Record<string, unknown> | undefined) ?? {};
    const pnmParameters = (cableModem.pnm_parameters as Record<string, unknown> | undefined) ?? {};
    const tftp = (pnmParameters.tftp as Record<string, unknown> | undefined) ?? {};
    const capture = (pnmParameters.capture as Record<string, unknown> | undefined) ?? {};
    const snmp = (cableModem.snmp as Record<string, unknown> | undefined) ?? {};
    const snmpV2C = (snmp.snmpV2C as Record<string, unknown> | undefined) ?? {};
    const execution = (parsed.execution as Record<string, unknown> | undefined) ?? {};

    const servingGroupIds = Array.isArray(servingGroup.id) ? servingGroup.id.filter((entry) => Number.isInteger(entry)) : [];
    const macAddresses = Array.isArray(cableModem.mac_address)
      ? cableModem.mac_address
        .filter((entry): entry is string => typeof entry === "string")
      : [];
    const channelIds = Array.isArray(capture.channel_ids) ? capture.channel_ids.filter((entry) => Number.isInteger(entry)) : [0];

    return {
      servingGroupIds: toCsv(servingGroupIds),
      macAddresses: toCsv(macAddresses),
      tftpIpv4: typeof tftp.ipv4 === "string" ? tftp.ipv4 : "",
      tftpIpv6: typeof tftp.ipv6 === "string" ? tftp.ipv6 : "",
      channelIds: channelIds.length > 0 ? toCsv(channelIds) : "0",
      community: typeof snmpV2C.community === "string" ? snmpV2C.community : "",
      maxWorkers: String(parseIntOrDefault(String(execution.max_workers ?? ""), 16)),
      retryCount: String(parseIntOrDefault(String(execution.retry_count ?? ""), 3)),
      retryDelaySeconds: String(parseIntOrDefault(String(execution.retry_delay_seconds ?? ""), 5)),
      perModemTimeoutSeconds: String(parseIntOrDefault(String(execution.per_modem_timeout_seconds ?? ""), 30)),
      overallTimeoutSeconds: String(parseIntOrDefault(String(execution.overall_timeout_seconds ?? ""), 120)),
    };
  } catch {
    return defaultFormValues;
  }
}

export function CmtsSgRxMerStartCaptureInputs({ payload, onPayloadChange, workflowId }: CmtsSgRxMerStartCaptureInputsProps) {
  const parsedFormValues = useMemo(() => parsePayloadToForm(payload), [payload]);
  const [formValues, setFormValues] = useState<StartCaptureFormValues>(parsedFormValues);

  useEffect(() => {
    setFormValues(parsedFormValues);
  }, [parsedFormValues]);

  function updateFormValue<K extends keyof StartCaptureFormValues>(key: K, value: StartCaptureFormValues[K]) {
    const nextValues: StartCaptureFormValues = { ...formValues, [key]: value };
    setFormValues(nextValues);
    onPayloadChange(toPrettyJson(buildPayloadFromForm(nextValues)));
  }

  return (
    <>
      <div className="grid">
        <div className="field">
          <label htmlFor={`${workflowId}-start-serving-group-ids`}>Serving Group IDs</label>
          <input
            id={`${workflowId}-start-serving-group-ids`}
            value={formValues.servingGroupIds}
            onChange={(event) => updateFormValue("servingGroupIds", event.target.value)}
            placeholder="empty = all serving groups"
          />
        </div>
        <div className="field">
          <label htmlFor={`${workflowId}-start-mac-addresses`}>Cable Modem MACs</label>
          <input
            id={`${workflowId}-start-mac-addresses`}
            value={formValues.macAddresses}
            onChange={(event) => updateFormValue("macAddresses", event.target.value)}
            placeholder="empty = all cable modems"
          />
        </div>
        <div className="field">
          <label htmlFor={`${workflowId}-start-channel-ids`}>Channel IDs</label>
          <input
            id={`${workflowId}-start-channel-ids`}
            value={formValues.channelIds}
            onChange={(event) => updateFormValue("channelIds", event.target.value)}
            placeholder="0 = all channels"
          />
        </div>
        <div className="field">
          <label htmlFor={`${workflowId}-start-community`}>SNMP v2c Community</label>
          <input
            id={`${workflowId}-start-community`}
            value={formValues.community}
            onChange={(event) => updateFormValue("community", event.target.value)}
            placeholder="private"
          />
        </div>
        <div className="field">
          <label htmlFor={`${workflowId}-start-tftp-ipv4`}>TFTP IPv4</label>
          <input
            id={`${workflowId}-start-tftp-ipv4`}
            value={formValues.tftpIpv4}
            onChange={(event) => updateFormValue("tftpIpv4", event.target.value)}
            placeholder="172.19.8.28"
          />
        </div>
        <div className="field">
          <label htmlFor={`${workflowId}-start-tftp-ipv6`}>TFTP IPv6</label>
          <input
            id={`${workflowId}-start-tftp-ipv6`}
            value={formValues.tftpIpv6}
            onChange={(event) => updateFormValue("tftpIpv6", event.target.value)}
            placeholder="::"
          />
        </div>
      </div>

      <div className="grid">
        <div className="field">
          <label htmlFor={`${workflowId}-start-max-workers`}>Max Workers</label>
          <input
            id={`${workflowId}-start-max-workers`}
            type="number"
            min={1}
            value={formValues.maxWorkers}
            onChange={(event) => updateFormValue("maxWorkers", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${workflowId}-start-retry-count`}>Retry Count</label>
          <input
            id={`${workflowId}-start-retry-count`}
            type="number"
            min={0}
            value={formValues.retryCount}
            onChange={(event) => updateFormValue("retryCount", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${workflowId}-start-retry-delay`}>Retry Delay Seconds</label>
          <input
            id={`${workflowId}-start-retry-delay`}
            type="number"
            min={0}
            value={formValues.retryDelaySeconds}
            onChange={(event) => updateFormValue("retryDelaySeconds", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${workflowId}-start-per-modem-timeout`}>Per-Modem Timeout Seconds</label>
          <input
            id={`${workflowId}-start-per-modem-timeout`}
            type="number"
            min={1}
            value={formValues.perModemTimeoutSeconds}
            onChange={(event) => updateFormValue("perModemTimeoutSeconds", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${workflowId}-start-overall-timeout`}>Overall Timeout Seconds</label>
          <input
            id={`${workflowId}-start-overall-timeout`}
            type="number"
            min={1}
            value={formValues.overallTimeoutSeconds}
            onChange={(event) => updateFormValue("overallTimeoutSeconds", event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${workflowId}-start-payload-preview`}>Request JSON</label>
        <textarea id={`${workflowId}-start-payload-preview`} className="mono" value={payload} readOnly rows={14} />
      </div>
    </>
  );
}
