import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { FieldLabel } from "@/components/common/FieldLabel";
import { SecretTextInput } from "@/components/common/SecretTextInput";
import { captureInputAutocomplete } from "@/pw/features/operations/captureInputAutocomplete";
import type { CaptureConnectivityInputs } from "@/pw/features/operations/captureConnectivity";
import { useReportCaptureConnectivityInputs } from "@/pw/features/operations/captureConnectivity";
import { requestFieldHints } from "@/pw/features/operations/requestFieldHints";
import { useCommonRequestFormDefaults } from "@/pw/features/operations/useRequestFormDefaults";
import {
  DEFAULT_CONSTELLATION_DISPLAY_CROSS_HAIR,
  DEFAULT_CONSTELLATION_MODULATION_ORDER_OFFSET,
  DEFAULT_CONSTELLATION_SAMPLE_SYMBOL_COUNT,
} from "@/pw/features/operations/operationDefaults";
import { parseChannelIds } from "@/lib/channelIds";
import type { SingleConstellationDisplayCaptureRequest } from "@/types/api";

interface ConstellationDisplayFormValues {
  macAddress: string;
  ipAddress: string;
  tftpIpv4: string;
  tftpIpv6: string;
  channelIds: string;
  community: string;
  displayCrossHair: boolean;
  modulationOrderOffset: number;
  numberSampleSymbol: number;
}

interface ConstellationDisplayCaptureRequestFormProps {
  isPending: boolean;
  canRun: boolean;
  submitLabel: string;
  onSubmit: (payload: SingleConstellationDisplayCaptureRequest) => void;
  onConnectivityInputsChange?: (inputs: CaptureConnectivityInputs) => void;
  errorMessage?: string;
  extraActions?: ReactNode;
  requestDefaultsOverride?: Partial<ConstellationDisplayFormValues>;
}

export function ConstellationDisplayCaptureRequestForm({
  isPending,
  canRun,
  submitLabel,
  onSubmit,
  onConnectivityInputsChange,
  errorMessage,
  extraActions,
  requestDefaultsOverride,
}: ConstellationDisplayCaptureRequestFormProps) {
  const baseRequestDefaults = useCommonRequestFormDefaults();
  const requestDefaults = useMemo(
    () => ({
      ...baseRequestDefaults,
      ...requestDefaultsOverride,
    }),
    [baseRequestDefaults, requestDefaultsOverride],
  );
  const { register, handleSubmit, reset, watch } = useForm<ConstellationDisplayFormValues>({
    defaultValues: {
      ...requestDefaults,
      displayCrossHair: DEFAULT_CONSTELLATION_DISPLAY_CROSS_HAIR,
      modulationOrderOffset: DEFAULT_CONSTELLATION_MODULATION_ORDER_OFFSET,
      numberSampleSymbol: DEFAULT_CONSTELLATION_SAMPLE_SYMBOL_COUNT,
    },
  });
  const [macAddress, ipAddress, community] = watch(["macAddress", "ipAddress", "community"]);

  useEffect(() => {
    reset({
      ...requestDefaults,
      displayCrossHair: DEFAULT_CONSTELLATION_DISPLAY_CROSS_HAIR,
      modulationOrderOffset: DEFAULT_CONSTELLATION_MODULATION_ORDER_OFFSET,
      numberSampleSymbol: DEFAULT_CONSTELLATION_SAMPLE_SYMBOL_COUNT,
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
              capture: {
                channel_ids: parseChannelIds(values.channelIds),
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
            plot: {
              ui: { theme: "dark" },
              options: {
                display_cross_hair: values.displayCrossHair,
              },
            },
          },
          capture_settings: {
            modulation_order_offset: values.modulationOrderOffset,
            number_sample_symbol: values.numberSampleSymbol,
          },
        });
      })}
    >
      <div className="grid two request-input-grid six-up">
        <div className="field">
          <FieldLabel htmlFor="constMacAddress" hint={requestFieldHints.mac_address}>MAC Address</FieldLabel>
          <input
            id="constMacAddress"
            autoComplete={captureInputAutocomplete.macAddress}
            {...register("macAddress")}
            placeholder="aa:bb:cc:dd:ee:ff"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="constIpAddress" hint={requestFieldHints.ip_address}>IP Address</FieldLabel>
          <input
            id="constIpAddress"
            autoComplete={captureInputAutocomplete.ipAddress}
            {...register("ipAddress")}
            placeholder="192.168.100.10"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="constTftpIpv4" hint={requestFieldHints.tftp_ipv4}>TFTP IPv4</FieldLabel>
          <input id="constTftpIpv4" {...register("tftpIpv4")} placeholder="192.168.100.2" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="constTftpIpv6" hint={requestFieldHints.tftp_ipv6}>TFTP IPv6</FieldLabel>
          <input id="constTftpIpv6" {...register("tftpIpv6")} placeholder="::1" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="constChannelIds" hint={requestFieldHints.channel_ids}>
            Channel IDs
          </FieldLabel>
          <input id="constChannelIds" {...register("channelIds")} placeholder="0" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="constCommunity" hint={requestFieldHints.snmp_rw_community}>SNMP RW Community</FieldLabel>
          <SecretTextInput
            id="constCommunity"
            autoComplete={captureInputAutocomplete.community}
            {...register("community")}
            placeholder="private"
          />
        </div>
      </div>
      <div className="grid two request-input-grid">
        <div className="field">
          <FieldLabel htmlFor="displayCrossHair" hint={requestFieldHints.display_cross_hair}>Display Cross Hair</FieldLabel>
          <select id="displayCrossHair" {...register("displayCrossHair", { setValueAs: (value) => value === "true" })}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
        <div className="field">
          <FieldLabel htmlFor="modulationOrderOffset" hint={requestFieldHints.modulation_order_offset}>Modulation Order Offset</FieldLabel>
          <input id="modulationOrderOffset" type="number" step="1" {...register("modulationOrderOffset", { valueAsNumber: true })} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="numberSampleSymbol" hint={requestFieldHints.number_sample_symbol}>Number Sample Symbol</FieldLabel>
          <input id="numberSampleSymbol" type="number" min="1" step="1" {...register("numberSampleSymbol", { valueAsNumber: true })} />
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
