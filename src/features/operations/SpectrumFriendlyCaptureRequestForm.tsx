import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { FieldLabel } from "@/components/common/FieldLabel";
import { SecretTextInput } from "@/components/common/SecretTextInput";
import { captureInputAutocomplete } from "@/features/operations/captureInputAutocomplete";
import type { CaptureConnectivityInputs } from "@/features/operations/captureConnectivity";
import { useReportCaptureConnectivityInputs } from "@/features/operations/captureConnectivity";
import { requestFieldHints } from "@/features/operations/requestFieldHints";
import {
  DEFAULT_SPECTRUM_ANALYZER_FRIENDLY_FIRST_SEGMENT_CENTER_FREQ_HZ,
  DEFAULT_SPECTRUM_ANALYZER_FRIENDLY_LAST_SEGMENT_CENTER_FREQ_HZ,
  DEFAULT_SPECTRUM_ANALYZER_FRIENDLY_RESOLUTION_BW_HZ,
  DEFAULT_SPECTRUM_ANALYZER_INACTIVITY_TIMEOUT_SECONDS,
  DEFAULT_SPECTRUM_ANALYZER_MOVING_AVERAGE_POINTS,
  DEFAULT_SPECTRUM_ANALYZER_NOISE_BW_HZ,
  defaultSpectrumAnalyzerRetrievalType,
  defaultSpectrumAnalyzerNumberOfAverages,
  defaultSpectrumAnalyzerWindowFunction,
  spectrumAnalyzerRetrievalTypeOptions,
  spectrumAnalyzerWindowFunctionOptions,
} from "@/features/operations/spectrumAnalyzerOptions";
import { useCommonRequestFormDefaults } from "@/features/operations/useRequestFormDefaults";
import { formatIntegerLikeInput, parseIntegerLikeInput } from "@/lib/forms/numericInput";
import type { SingleSpectrumFriendlyCaptureRequest } from "@/types/api";

interface SpectrumFriendlyFormValues {
  macAddress: string;
  ipAddress: string;
  tftpIpv4: string;
  tftpIpv6: string;
  community: string;
  movingAveragePoints: number;
  inactivityTimeout: number;
  firstSegmentCenterFreq: string;
  lastSegmentCenterFreq: string;
  resolutionBw: string;
  noiseBw: string;
  windowFunction: number;
  numAverages: number;
  spectrumRetrievalType: number;
}

interface SpectrumFriendlyCaptureRequestFormProps {
  isPending: boolean;
  canRun: boolean;
  submitLabel: string;
  onSubmit: (payload: SingleSpectrumFriendlyCaptureRequest) => void;
  onConnectivityInputsChange?: (inputs: CaptureConnectivityInputs) => void;
  errorMessage?: string;
  extraActions?: ReactNode;
}

export function SpectrumFriendlyCaptureRequestForm({
  isPending,
  canRun,
  submitLabel,
  onSubmit,
  onConnectivityInputsChange,
  errorMessage,
  extraActions,
}: SpectrumFriendlyCaptureRequestFormProps) {
  const requestDefaults = useCommonRequestFormDefaults();
  const { register, handleSubmit, reset, watch } = useForm<SpectrumFriendlyFormValues>({
    defaultValues: {
      macAddress: requestDefaults.macAddress,
      ipAddress: requestDefaults.ipAddress,
      tftpIpv4: requestDefaults.tftpIpv4,
      tftpIpv6: requestDefaults.tftpIpv6,
      community: requestDefaults.community,
      movingAveragePoints: DEFAULT_SPECTRUM_ANALYZER_MOVING_AVERAGE_POINTS,
      inactivityTimeout: DEFAULT_SPECTRUM_ANALYZER_INACTIVITY_TIMEOUT_SECONDS,
      firstSegmentCenterFreq: formatIntegerLikeInput(DEFAULT_SPECTRUM_ANALYZER_FRIENDLY_FIRST_SEGMENT_CENTER_FREQ_HZ),
      lastSegmentCenterFreq: formatIntegerLikeInput(DEFAULT_SPECTRUM_ANALYZER_FRIENDLY_LAST_SEGMENT_CENTER_FREQ_HZ),
      resolutionBw: formatIntegerLikeInput(DEFAULT_SPECTRUM_ANALYZER_FRIENDLY_RESOLUTION_BW_HZ),
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
            first_segment_center_freq: parseIntegerLikeInput(values.firstSegmentCenterFreq),
            last_segment_center_freq: parseIntegerLikeInput(values.lastSegmentCenterFreq),
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
          <FieldLabel htmlFor="spectrumFriendlyMacAddress" hint={requestFieldHints.mac_address}>MAC Address</FieldLabel>
          <input
            id="spectrumFriendlyMacAddress"
            autoComplete={captureInputAutocomplete.macAddress}
            {...register("macAddress")}
            placeholder="aa:bb:cc:dd:ee:ff"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyIpAddress" hint={requestFieldHints.ip_address}>IP Address</FieldLabel>
          <input
            id="spectrumFriendlyIpAddress"
            autoComplete={captureInputAutocomplete.ipAddress}
            {...register("ipAddress")}
            placeholder="192.168.100.10"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyTftpIpv4" hint={requestFieldHints.tftp_ipv4}>TFTP IPv4</FieldLabel>
          <input id="spectrumFriendlyTftpIpv4" {...register("tftpIpv4")} placeholder="192.168.100.2" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyTftpIpv6" hint={requestFieldHints.tftp_ipv6}>TFTP IPv6</FieldLabel>
          <input id="spectrumFriendlyTftpIpv6" {...register("tftpIpv6")} placeholder="::1" />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyCommunity" hint={requestFieldHints.snmp_rw_community}>SNMP RW Community</FieldLabel>
          <SecretTextInput
            id="spectrumFriendlyCommunity"
            autoComplete={captureInputAutocomplete.community}
            {...register("community")}
            placeholder="private"
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyMovingAveragePoints" hint={requestFieldHints.moving_average_points}>Moving Average Points</FieldLabel>
          <input id="spectrumFriendlyMovingAveragePoints" type="number" {...register("movingAveragePoints", { valueAsNumber: true })} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyInactivityTimeout" hint={requestFieldHints.inactivity_timeout}>Inactivity Timeout</FieldLabel>
          <input id="spectrumFriendlyInactivityTimeout" type="number" {...register("inactivityTimeout", { valueAsNumber: true })} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyResolutionBw" hint={requestFieldHints.resolution_bw}>Resolution BW</FieldLabel>
          <input id="spectrumFriendlyResolutionBw" type="text" inputMode="numeric" {...register("resolutionBw")} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyFirstSegmentCenterFreq" hint={requestFieldHints.first_segment_center_freq}>First Segment Center Freq</FieldLabel>
          <input id="spectrumFriendlyFirstSegmentCenterFreq" type="text" inputMode="numeric" {...register("firstSegmentCenterFreq")} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyLastSegmentCenterFreq" hint={requestFieldHints.last_segment_center_freq}>Last Segment Center Freq</FieldLabel>
          <input id="spectrumFriendlyLastSegmentCenterFreq" type="text" inputMode="numeric" {...register("lastSegmentCenterFreq")} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyNoiseBw" hint={requestFieldHints.noise_bw}>Noise BW</FieldLabel>
          <input id="spectrumFriendlyNoiseBw" type="text" inputMode="numeric" {...register("noiseBw")} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyWindowFunction" hint={requestFieldHints.window_function}>Window Function</FieldLabel>
          <select id="spectrumFriendlyWindowFunction" {...register("windowFunction", { valueAsNumber: true })}>
            {spectrumAnalyzerWindowFunctionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlyNumAverages" hint={requestFieldHints.num_averages}>Num Averages</FieldLabel>
          <input id="spectrumFriendlyNumAverages" type="number" {...register("numAverages", { valueAsNumber: true })} />
        </div>
        <div className="field">
          <FieldLabel htmlFor="spectrumFriendlySpectrumRetrievalType" hint={requestFieldHints.spectrum_retrieval_type}>Spectrum Retrieval Type</FieldLabel>
          <select id="spectrumFriendlySpectrumRetrievalType" {...register("spectrumRetrievalType", { valueAsNumber: true })}>
            {spectrumAnalyzerRetrievalTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
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
