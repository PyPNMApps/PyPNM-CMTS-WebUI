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
  defaultSpectrumAnalyzerDirection,
  defaultSpectrumAnalyzerNumberOfAverages,
  defaultSpectrumAnalyzerRetrievalType,
  defaultSpectrumAnalyzerWindowFunction,
  DEFAULT_SPECTRUM_ANALYZER_FULL_BAND_RESOLUTION_BW_HZ,
  DEFAULT_SPECTRUM_ANALYZER_INACTIVITY_TIMEOUT_SECONDS,
  DEFAULT_SPECTRUM_ANALYZER_MOVING_AVERAGE_POINTS,
  DEFAULT_SPECTRUM_ANALYZER_NOISE_BW_HZ,
  spectrumAnalyzerDirectionOptions,
  spectrumAnalyzerRetrievalTypeOptions,
  spectrumAnalyzerWindowFunctionOptions,
} from "@/features/operations/spectrumAnalyzerOptions";
import { useCommonRequestFormDefaults } from "@/features/operations/useRequestFormDefaults";
import { formatIntegerLikeInput, parseIntegerLikeInput } from "@/lib/forms/numericInput";
import type { SingleSpectrumFullBandCaptureRequest } from "@/types/api";

interface SpectrumFullBandFormValues {
  macAddress: string;
  ipAddress: string;
  tftpIpv4: string;
  tftpIpv6: string;
  community: string;
  movingAveragePoints: number;
  inactivityTimeout: number;
  direction: "downstream" | "upstream";
  resolutionBw: string;
  noiseBw: string;
  windowFunction: number;
  numAverages: number;
  spectrumRetrievalType: number;
}

interface SpectrumFullBandCaptureRequestFormProps {
  isPending: boolean;
  canRun: boolean;
  submitLabel: string;
  onSubmit: (payload: SingleSpectrumFullBandCaptureRequest) => void;
  onConnectivityInputsChange?: (inputs: CaptureConnectivityInputs) => void;
  errorMessage?: string;
  extraActions?: ReactNode;
  requestDefaultsOverride?: Partial<SpectrumFullBandFormValues>;
}

export function SpectrumFullBandCaptureRequestForm({
  isPending,
  canRun,
  submitLabel,
  onSubmit,
  onConnectivityInputsChange,
  errorMessage,
  extraActions,
  requestDefaultsOverride,
}: SpectrumFullBandCaptureRequestFormProps) {
  const baseRequestDefaults = useCommonRequestFormDefaults();
  const requestDefaults = useMemo(
    () => ({
      ...baseRequestDefaults,
      ...requestDefaultsOverride,
    }),
    [baseRequestDefaults, requestDefaultsOverride],
  );
  const { register, handleSubmit, reset, watch } = useForm<SpectrumFullBandFormValues>({
    defaultValues: {
      macAddress: requestDefaults.macAddress,
      ipAddress: requestDefaults.ipAddress,
      tftpIpv4: requestDefaults.tftpIpv4,
      tftpIpv6: requestDefaults.tftpIpv6,
      community: requestDefaults.community,
      movingAveragePoints: DEFAULT_SPECTRUM_ANALYZER_MOVING_AVERAGE_POINTS,
      inactivityTimeout: DEFAULT_SPECTRUM_ANALYZER_INACTIVITY_TIMEOUT_SECONDS,
      direction: defaultSpectrumAnalyzerDirection,
      resolutionBw: formatIntegerLikeInput(DEFAULT_SPECTRUM_ANALYZER_FULL_BAND_RESOLUTION_BW_HZ),
      noiseBw: formatIntegerLikeInput(DEFAULT_SPECTRUM_ANALYZER_NOISE_BW_HZ),
      windowFunction: defaultSpectrumAnalyzerWindowFunction,
      numAverages: defaultSpectrumAnalyzerNumberOfAverages,
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
            spectrum_analysis: {
              moving_average: {
                points: Number(values.movingAveragePoints),
              },
            },
          },
          capture_parameters: {
            inactivity_timeout: Number(values.inactivityTimeout),
            direction: values.direction,
            resolution_bw: parseIntegerLikeInput(values.resolutionBw),
            noise_bw: parseIntegerLikeInput(values.noiseBw),
            window_function: Number(values.windowFunction),
            num_averages: Number(values.numAverages),
            spectrum_retrieval_type: Number(values.spectrumRetrievalType),
          },
        });
      })}
    >
      <div className="grid two">
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandMacAddress" hint={requestFieldHints.mac_address}>MAC Address</FieldLabel>
          <input
            id="spectrumFullBandMacAddress"
            autoComplete={captureInputAutocomplete.macAddress}
            {...register("macAddress")}
            placeholder="aa:bb:cc:dd:ee:ff"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandIpAddress" hint={requestFieldHints.ip_address}>IP Address</FieldLabel>
          <input
            id="spectrumFullBandIpAddress"
            autoComplete={captureInputAutocomplete.ipAddress}
            {...register("ipAddress")}
            placeholder="192.168.100.10"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandTftpIpv4" hint={requestFieldHints.tftp_ipv4}>TFTP IPv4</FieldLabel>
          <input id="spectrumFullBandTftpIpv4" {...register("tftpIpv4")} placeholder="192.168.100.2" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandTftpIpv6" hint={requestFieldHints.tftp_ipv6}>TFTP IPv6</FieldLabel>
          <input id="spectrumFullBandTftpIpv6" {...register("tftpIpv6")} placeholder="::1" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandCommunity" hint={requestFieldHints.snmp_rw_community}>SNMP RW Community</FieldLabel>
          <SecretTextInput
            id="spectrumFullBandCommunity"
            autoComplete={captureInputAutocomplete.community}
            {...register("community")}
            placeholder="private"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandMovingAveragePoints" hint={requestFieldHints.moving_average_points}>Moving Average Points</FieldLabel>
          <input id="spectrumFullBandMovingAveragePoints" type="number" {...register("movingAveragePoints", { valueAsNumber: true })} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandInactivityTimeout" hint={requestFieldHints.inactivity_timeout}>Inactivity Timeout</FieldLabel>
          <input id="spectrumFullBandInactivityTimeout" type="number" {...register("inactivityTimeout", { valueAsNumber: true })} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandDirection" hint={requestFieldHints.spectrum_direction}>Direction</FieldLabel>
          <select id="spectrumFullBandDirection" {...register("direction")}>
            {spectrumAnalyzerDirectionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandResolutionBw" hint={requestFieldHints.resolution_bw}>Resolution BW</FieldLabel>
          <input id="spectrumFullBandResolutionBw" type="text" inputMode="numeric" {...register("resolutionBw")} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandNoiseBw" hint={requestFieldHints.noise_bw}>Noise BW</FieldLabel>
          <input id="spectrumFullBandNoiseBw" type="text" inputMode="numeric" {...register("noiseBw")} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandWindowFunction" hint={requestFieldHints.window_function}>Window Function</FieldLabel>
          <select id="spectrumFullBandWindowFunction" {...register("windowFunction", { valueAsNumber: true })}>
            {spectrumAnalyzerWindowFunctionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandNumAverages" hint={requestFieldHints.num_averages}>Num Averages</FieldLabel>
          <input id="spectrumFullBandNumAverages" type="number" {...register("numAverages", { valueAsNumber: true })} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFullBandSpectrumRetrievalType" hint={requestFieldHints.spectrum_retrieval_type}>Spectrum Retrieval Type</FieldLabel>
          <select id="spectrumFullBandSpectrumRetrievalType" {...register("spectrumRetrievalType", { valueAsNumber: true })}>
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
