import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { FieldLabel } from "@/components/common/FieldLabel";
import { SecretTextInput } from "@/components/common/SecretTextInput";
import { captureInputAutocomplete } from "@/features/operations/captureInputAutocomplete";
import type { CaptureConnectivityInputs } from "@/features/operations/captureConnectivity";
import { useReportCaptureConnectivityInputs } from "@/features/operations/captureConnectivity";
import { requestFieldHints } from "@/features/operations/requestFieldHints";
import { useCommonRequestFormDefaults } from "@/features/operations/useRequestFormDefaults";
import { DEFAULT_HISTOGRAM_SAMPLE_DURATION_SECONDS } from "@/features/operations/operationDefaults";
import type { SingleHistogramCaptureRequest } from "@/types/api";

interface HistogramCaptureFormValues {
  macAddress: string;
  ipAddress: string;
  tftpIpv4: string;
  tftpIpv6: string;
  community: string;
  sampleDuration: number;
}

interface HistogramCaptureRequestFormProps {
  isPending: boolean;
  canRun: boolean;
  submitLabel: string;
  onSubmit: (payload: SingleHistogramCaptureRequest) => void;
  onConnectivityInputsChange?: (inputs: CaptureConnectivityInputs) => void;
  errorMessage?: string;
  extraActions?: ReactNode;
}

export function HistogramCaptureRequestForm({
  isPending,
  canRun,
  submitLabel,
  onSubmit,
  onConnectivityInputsChange,
  errorMessage,
  extraActions,
}: HistogramCaptureRequestFormProps) {
  const requestDefaults = useCommonRequestFormDefaults();
  const { register, handleSubmit, reset, watch } = useForm<HistogramCaptureFormValues>({
    defaultValues: {
      macAddress: requestDefaults.macAddress,
      ipAddress: requestDefaults.ipAddress,
      tftpIpv4: requestDefaults.tftpIpv4,
      tftpIpv6: requestDefaults.tftpIpv6,
      community: requestDefaults.community,
      sampleDuration: DEFAULT_HISTOGRAM_SAMPLE_DURATION_SECONDS,
    },
  });
  const [macAddress, ipAddress, community] = watch(["macAddress", "ipAddress", "community"]);

  useEffect(() => {
    reset({
      macAddress: requestDefaults.macAddress,
      ipAddress: requestDefaults.ipAddress,
      tftpIpv4: requestDefaults.tftpIpv4,
      tftpIpv6: requestDefaults.tftpIpv6,
      community: requestDefaults.community,
      sampleDuration: DEFAULT_HISTOGRAM_SAMPLE_DURATION_SECONDS,
    });
  }, [requestDefaults, reset]);

  useReportCaptureConnectivityInputs({ macAddress, ipAddress, community }, onConnectivityInputsChange);

  return (
    <form
      className="grid"
      onSubmit={handleSubmit((values) => {
        onSubmit({
          cable_modem: {
            mac_address: values.macAddress,
            ip_address: values.ipAddress,
            pnm_parameters: {
              tftp: {
                ipv4: values.tftpIpv4,
                ipv6: values.tftpIpv6,
              },
            },
            snmp: {
              snmpV2C: {
                community: values.community,
              },
            },
          },
          analysis: {
            type: "basic",
            output: { type: "json" },
            plot: { ui: { theme: "dark" } },
          },
          capture_settings: {
            sample_duration: values.sampleDuration,
          },
        });
      })}
    >
      <div className="grid two request-input-grid">
        <div className="field">
          <FieldLabel htmlFor="histMacAddress" hint={requestFieldHints.mac_address}>MAC Address</FieldLabel>
          <input
            id="histMacAddress"
            autoComplete={captureInputAutocomplete.macAddress}
            {...register("macAddress")}
            placeholder="aa:bb:cc:dd:ee:ff"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="histIpAddress" hint={requestFieldHints.ip_address}>IP Address</FieldLabel>
          <input
            id="histIpAddress"
            autoComplete={captureInputAutocomplete.ipAddress}
            {...register("ipAddress")}
            placeholder="192.168.100.10"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="histTftpIpv4" hint={requestFieldHints.tftp_ipv4}>TFTP IPv4</FieldLabel>
          <input id="histTftpIpv4" {...register("tftpIpv4")} placeholder="192.168.100.2" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="histTftpIpv6" hint={requestFieldHints.tftp_ipv6}>TFTP IPv6</FieldLabel>
          <input id="histTftpIpv6" {...register("tftpIpv6")} placeholder="::1" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="histCommunity" hint={requestFieldHints.snmp_rw_community}>SNMP RW Community</FieldLabel>
          <SecretTextInput
            id="histCommunity"
            autoComplete={captureInputAutocomplete.community}
            {...register("community")}
            placeholder="private"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="sampleDuration" hint={requestFieldHints.sample_duration}>Sample Duration</FieldLabel>
          <input id="sampleDuration" type="number" min="1" step="1" {...register("sampleDuration", { valueAsNumber: true })} />
        </div>
      </div>
      <div className="actions">
        <button type="submit" className="primary" disabled={isPending || !canRun}>
          {isPending ? "Running..." : submitLabel}
        </button>
        {extraActions}
      </div>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </form>
  );
}
