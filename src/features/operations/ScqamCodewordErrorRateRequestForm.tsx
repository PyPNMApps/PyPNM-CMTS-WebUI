import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FieldLabel } from "@/components/common/FieldLabel";
import { SecretTextInput } from "@/components/common/SecretTextInput";
import { captureInputAutocomplete } from "@/features/operations/captureInputAutocomplete";
import type { CaptureConnectivityInputs } from "@/features/operations/captureConnectivity";
import { useReportCaptureConnectivityInputs } from "@/features/operations/captureConnectivity";
import { requestFieldHints } from "@/features/operations/requestFieldHints";
import { DEFAULT_SCQAM_CODEWORD_SAMPLE_TIME_SECONDS } from "@/features/operations/operationDefaults";
import { useDeviceConnectFormDefaults } from "@/features/operations/useRequestFormDefaults";
import type { DsScqamCodewordErrorRateRequest } from "@/types/api";

interface ScqamCodewordErrorRateFormValues {
  macAddress: string;
  ipAddress: string;
  community: string;
  sampleTimeElapsed: number;
}

interface ScqamCodewordErrorRateRequestFormProps {
  isPending: boolean;
  canRun: boolean;
  submitLabel: string;
  onSubmit: (payload: DsScqamCodewordErrorRateRequest) => void;
  onConnectivityInputsChange?: (inputs: CaptureConnectivityInputs) => void;
  errorMessage?: string;
}

export function ScqamCodewordErrorRateRequestForm({
  isPending,
  canRun,
  submitLabel,
  onSubmit,
  onConnectivityInputsChange,
  errorMessage,
}: ScqamCodewordErrorRateRequestFormProps) {
  const requestDefaults = useDeviceConnectFormDefaults();
  const { register, handleSubmit, reset, watch } = useForm<ScqamCodewordErrorRateFormValues>({
    defaultValues: {
      ...requestDefaults,
      sampleTimeElapsed: DEFAULT_SCQAM_CODEWORD_SAMPLE_TIME_SECONDS,
    },
  });
  const [macAddress, ipAddress, community] = watch(["macAddress", "ipAddress", "community"]);

  useEffect(() => {
    reset({
      ...requestDefaults,
      sampleTimeElapsed: DEFAULT_SCQAM_CODEWORD_SAMPLE_TIME_SECONDS,
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
            snmp: {
              snmpV2C: {
                community: values.community,
              },
            },
          },
          capture_parameters: {
            sample_time_elapsed: Number(values.sampleTimeElapsed),
          },
        });
      })}
    >
      <div className="grid two">
        <div className="field">
          <FieldLabel htmlFor="scqamCodewordMacAddress" hint={requestFieldHints.mac_address}>MAC Address</FieldLabel>
          <input
            id="scqamCodewordMacAddress"
            autoComplete={captureInputAutocomplete.macAddress}
            {...register("macAddress")}
            placeholder="aa:bb:cc:dd:ee:ff"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="scqamCodewordIpAddress" hint={requestFieldHints.ip_address}>IP Address</FieldLabel>
          <input
            id="scqamCodewordIpAddress"
            autoComplete={captureInputAutocomplete.ipAddress}
            {...register("ipAddress")}
            placeholder="192.168.100.10"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="scqamCodewordCommunity" hint={requestFieldHints.snmp_rw_community}>SNMP RW Community</FieldLabel>
          <SecretTextInput
            id="scqamCodewordCommunity"
            autoComplete={captureInputAutocomplete.community}
            {...register("community")}
            placeholder="private"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="scqamCodewordSampleTimeElapsed" hint={requestFieldHints.sample_time_elapsed}>Sample Time Elapsed</FieldLabel>
          <input
            id="scqamCodewordSampleTimeElapsed"
            type="number"
            min={1}
            step={1}
            {...register("sampleTimeElapsed", { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="actions">
        <button type="submit" className="primary" disabled={isPending || !canRun}>
          {isPending ? "Running..." : submitLabel}
        </button>
      </div>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </form>
  );
}
