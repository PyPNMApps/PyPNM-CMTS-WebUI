import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { FieldLabel } from "@/components/common/FieldLabel";
import { SecretTextInput } from "@/components/common/SecretTextInput";
import { captureInputAutocomplete } from "@/features/operations/captureInputAutocomplete";
import type { CaptureConnectivityInputs } from "@/features/operations/captureConnectivity";
import { useReportCaptureConnectivityInputs } from "@/features/operations/captureConnectivity";
import { requestFieldHints } from "@/features/operations/requestFieldHints";
import {
  DEFAULT_SPECTRUM_ANALYZER_MOVING_AVERAGE_POINTS,
  DEFAULT_SPECTRUM_ANALYZER_OFDM_RESOLUTION_BANDWIDTH_HZ,
  defaultSpectrumAnalyzerNumberOfAverages,
  defaultSpectrumAnalyzerRetrievalType,
  spectrumAnalyzerRetrievalTypeOptions,
} from "@/features/operations/spectrumAnalyzerOptions";
import { useCommonRequestFormDefaults } from "@/features/operations/useRequestFormDefaults";
import { parseChannelIds } from "@/lib/channelIds";
import { formatIntegerLikeInput, parseIntegerLikeInput } from "@/lib/forms/numericInput";
import type { SingleSpectrumOfdmCaptureRequest } from "@/types/api";

interface SpectrumOfdmFormValues {
  macAddress: string;
  ipAddress: string;
  tftpIpv4: string;
  tftpIpv6: string;
  channelIds: string;
  community: string;
  movingAveragePoints: number;
  numberOfAverages: number;
  resolutionBandwidthHz: string;
  spectrumRetrievalType: number;
}

interface SpectrumOfdmCaptureRequestFormProps {
  isPending: boolean;
  canRun: boolean;
  submitLabel: string;
  onSubmit: (payload: SingleSpectrumOfdmCaptureRequest) => void;
  onConnectivityInputsChange?: (inputs: CaptureConnectivityInputs) => void;
  errorMessage?: string;
  extraActions?: ReactNode;
  requestDefaultsOverride?: Partial<SpectrumOfdmFormValues>;
}

export function SpectrumOfdmCaptureRequestForm({
  isPending,
  canRun,
  submitLabel,
  onSubmit,
  onConnectivityInputsChange,
  errorMessage,
  extraActions,
  requestDefaultsOverride,
}: SpectrumOfdmCaptureRequestFormProps) {
  const baseRequestDefaults = useCommonRequestFormDefaults();
  const requestDefaults = useMemo(
    () => ({
      ...baseRequestDefaults,
      ...requestDefaultsOverride,
    }),
    [baseRequestDefaults, requestDefaultsOverride],
  );
  const { register, handleSubmit, reset, watch } = useForm<SpectrumOfdmFormValues>({
    defaultValues: {
      macAddress: requestDefaults.macAddress,
      ipAddress: requestDefaults.ipAddress,
      tftpIpv4: requestDefaults.tftpIpv4,
      tftpIpv6: requestDefaults.tftpIpv6,
      channelIds: requestDefaults.channelIds,
      community: requestDefaults.community,
      movingAveragePoints: DEFAULT_SPECTRUM_ANALYZER_MOVING_AVERAGE_POINTS,
      numberOfAverages: defaultSpectrumAnalyzerNumberOfAverages,
      resolutionBandwidthHz: formatIntegerLikeInput(DEFAULT_SPECTRUM_ANALYZER_OFDM_RESOLUTION_BANDWIDTH_HZ),
      spectrumRetrievalType: defaultSpectrumAnalyzerRetrievalType,
    },
  });
  const [macAddress, ipAddress, community] = watch(["macAddress", "ipAddress", "community"]);

  useEffect(() => {
    reset((current) => ({
      ...current,
      macAddress: requestDefaults.macAddress,
      ipAddress: requestDefaults.ipAddress,
      tftpIpv4: requestDefaults.tftpIpv4,
      tftpIpv6: requestDefaults.tftpIpv6,
      channelIds: requestDefaults.channelIds,
      community: requestDefaults.community,
    }));
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
              tftp: { ipv4: values.tftpIpv4, ipv6: values.tftpIpv6 },
              capture: { channel_ids: parseChannelIds(values.channelIds) },
            },
            snmp: { snmpV2C: { community: values.community } },
          },
          analysis: {
            type: "basic",
            output: { type: "json" },
            plot: { ui: { theme: "dark" } },
            spectrum_analysis: { moving_average: { points: Number(values.movingAveragePoints) } },
          },
          capture_parameters: {
            number_of_averages: Number(values.numberOfAverages),
            resolution_bandwidth_hz: parseIntegerLikeInput(values.resolutionBandwidthHz),
            spectrum_retrieval_type: Number(values.spectrumRetrievalType),
          },
        });
      })}
    >
      <div className="grid two">
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmMacAddress" hint={requestFieldHints.mac_address}>MAC Address</FieldLabel>
          <input
            id="spectrumOfdmMacAddress"
            autoComplete={captureInputAutocomplete.macAddress}
            {...register("macAddress")}
            placeholder="aa:bb:cc:dd:ee:ff"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmIpAddress" hint={requestFieldHints.ip_address}>IP Address</FieldLabel>
          <input
            id="spectrumOfdmIpAddress"
            autoComplete={captureInputAutocomplete.ipAddress}
            {...register("ipAddress")}
            placeholder="192.168.100.10"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmTftpIpv4" hint={requestFieldHints.tftp_ipv4}>TFTP IPv4</FieldLabel>
          <input id="spectrumOfdmTftpIpv4" {...register("tftpIpv4")} placeholder="192.168.100.2" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmTftpIpv6" hint={requestFieldHints.tftp_ipv6}>TFTP IPv6</FieldLabel>
          <input id="spectrumOfdmTftpIpv6" {...register("tftpIpv6")} placeholder="::1" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmChannelIds" hint={requestFieldHints.channel_ids}>Channel IDs</FieldLabel>
          <input id="spectrumOfdmChannelIds" {...register("channelIds")} placeholder="0" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmCommunity" hint={requestFieldHints.snmp_rw_community}>SNMP RW Community</FieldLabel>
          <SecretTextInput
            id="spectrumOfdmCommunity"
            autoComplete={captureInputAutocomplete.community}
            {...register("community")}
            placeholder="private"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmMovingAveragePoints" hint={requestFieldHints.moving_average_points}>Moving Average Points</FieldLabel>
          <input id="spectrumOfdmMovingAveragePoints" type="number" {...register("movingAveragePoints", { valueAsNumber: true })} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmNumberOfAverages" hint={requestFieldHints.number_of_averages}>Number Of Averages</FieldLabel>
          <input id="spectrumOfdmNumberOfAverages" type="number" {...register("numberOfAverages", { valueAsNumber: true })} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmResolutionBandwidthHz" hint={requestFieldHints.resolution_bandwidth_hz}>Resolution Bandwidth</FieldLabel>
          <input id="spectrumOfdmResolutionBandwidthHz" type="text" inputMode="numeric" {...register("resolutionBandwidthHz")} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumOfdmSpectrumRetrievalType" hint={requestFieldHints.spectrum_retrieval_type}>Spectrum Retrieval Type</FieldLabel>
          <select id="spectrumOfdmSpectrumRetrievalType" {...register("spectrumRetrievalType", { valueAsNumber: true })}>
            {spectrumAnalyzerRetrievalTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
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
