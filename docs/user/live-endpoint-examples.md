# Live Endpoint Form Examples

This page links each UI form endpoint to its sanitized live-capture JSON output.

- source instance: `pypnm-agent-1`
- source base URL: `http://172.19.8.28:8000`
- capture set timestamp: `2026-03-28T03:54:42.172Z`
- sanitizer rules:
  - MAC OUI masked to `00:00:00`
  - `system_description` sanitized
  - `sysDescr` sanitized

## Signal Capture Forms

| Form | Endpoint | Sanitized JSON |
| --- | --- | --- |
| RxMER | `/docs/pnm/ds/ofdm/rxMer/getCapture` | [single-rxmer.sanitized.json](../examples/live-captures/single-rxmer.sanitized.json) |
| Channel Estimation | `/docs/pnm/ds/ofdm/channelEstCoeff/getCapture` | [single-channel-estimation.sanitized.json](../examples/live-captures/single-channel-estimation.sanitized.json) |
| Histogram | `/docs/pnm/ds/histogram/getCapture` | [single-histogram.sanitized.json](../examples/live-captures/single-histogram.sanitized.json) |
| FEC Summary | `/docs/pnm/ds/ofdm/fecSummary/getCapture` | [single-fec-summary.sanitized.json](../examples/live-captures/single-fec-summary.sanitized.json) |
| Constellation Display | `/docs/pnm/ds/ofdm/constellationDisplay/getCapture` | [single-constellation-display.sanitized.json](../examples/live-captures/single-constellation-display.sanitized.json) |
| Modulation Profile | `/docs/pnm/ds/ofdm/modulationProfile/getCapture` | [single-modulation-profile.sanitized.json](../examples/live-captures/single-modulation-profile.sanitized.json) |
| US OFDMA PreEqualization | `/docs/pnm/us/ofdma/preEqualization/getCapture` | [single-us-ofdma-pre-equalization.sanitized.json](../examples/live-captures/single-us-ofdma-pre-equalization.sanitized.json) |

## Spectrum Analyzer Forms (SNMP Only)

| Form | Endpoint | Sanitized JSON |
| --- | --- | --- |
| Friendly | `/docs/pnm/ds/spectrumAnalyzer/getCapture/friendly` | [spectrum-friendly.sanitized.json](../examples/live-captures/spectrum-friendly.sanitized.json) |
| Full Band | `/docs/pnm/ds/spectrumAnalyzer/getCapture/fullBandCapture` | [spectrum-full-band.sanitized.json](../examples/live-captures/spectrum-full-band.sanitized.json) |
| OFDM | `/docs/pnm/ds/spectrumAnalyzer/getCapture/ofdm` | [spectrum-ofdm.sanitized.json](../examples/live-captures/spectrum-ofdm.sanitized.json) |
| SCQAM | `/docs/pnm/ds/spectrumAnalyzer/getCapture/scqam` | [spectrum-scqam.sanitized.json](../examples/live-captures/spectrum-scqam.sanitized.json) |

## Operations Forms

| Form | Endpoint | Sanitized JSON |
| --- | --- | --- |
| IF31 DOCSIS Base Capability | `/docs/if31/docsis/baseCapability` | [if31-docsis-base-capability.sanitized.json](../examples/live-captures/if31-docsis-base-capability.sanitized.json) |
| IF31 DS OFDM Channel Stats | `/docs/if31/ds/ofdm/chan/stats` | [if31-ds-ofdm-channel-stats.sanitized.json](../examples/live-captures/if31-ds-ofdm-channel-stats.sanitized.json) |
| IF31 DS OFDM Profile Stats | `/docs/if31/ds/ofdm/profile/stats` | [if31-ds-ofdm-profile-stats.sanitized.json](../examples/live-captures/if31-ds-ofdm-profile-stats.sanitized.json) |
| IF31 System Diplexer | `/docs/if31/system/diplexer` | [if31-system-diplexer.sanitized.json](../examples/live-captures/if31-system-diplexer.sanitized.json) |
| IF31 US OFDMA Channel Stats | `/docs/if31/us/ofdma/channel/stats` | [if31-us-ofdma-channel-stats.sanitized.json](../examples/live-captures/if31-us-ofdma-channel-stats.sanitized.json) |
| FDD Diplexer Band Edge Capability | `/docs/fdd/diplexer/bandEdgeCapability` | [fdd-diplexer-band-edge-capability.sanitized.json](../examples/live-captures/fdd-diplexer-band-edge-capability.sanitized.json) |
| FDD System Diplexer Configuration | `/docs/fdd/system/diplexer/configuration` | [fdd-system-diplexer-configuration.sanitized.json](../examples/live-captures/fdd-system-diplexer-configuration.sanitized.json) |
| DS SCQAM Codeword Error Rate | `/docs/if30/ds/scqam/chan/codewordErrorRate` | [ds-scqam-codeword-error-rate.sanitized.json](../examples/live-captures/ds-scqam-codeword-error-rate.sanitized.json) |
| DS SCQAM Channel Stats | `/docs/if30/ds/scqam/chan/stats` | [ds-scqam-channel-stats.sanitized.json](../examples/live-captures/ds-scqam-channel-stats.sanitized.json) |
| ATDMA PreEqualization | `/docs/if30/us/atdma/chan/preEqualization` | [atdma-pre-equalization.sanitized.json](../examples/live-captures/atdma-pre-equalization.sanitized.json) |
| ATDMA Channel Stats | `/docs/if30/us/atdma/chan/stats` | [atdma-channel-stats.sanitized.json](../examples/live-captures/atdma-channel-stats.sanitized.json) |
| Event Log | `/docs/dev/eventLog` | [event-log.sanitized.json](../examples/live-captures/event-log.sanitized.json) |
| Interface Stats | `/docs/pnm/interface/stats` | [interface-stats.sanitized.json](../examples/live-captures/interface-stats.sanitized.json) |
| UpTime | `/system/upTime` | [up-time.sanitized.json](../examples/live-captures/up-time.sanitized.json) |
| sysDescr | `/system/sysDescr` | [system-sysdescr.sanitized.json](../examples/live-captures/system-sysdescr.sanitized.json) |

## Advanced Analysis React Forms

These forms are used by the `Advanced` React workbenches.

### Advanced RxMER

| Form Action | Endpoint |
| --- | --- |
| Start Capture | `/advance/multi/ds/rxMer/start` |
| Status | `/advance/multi/ds/rxMer/status/{operation_id}` |
| Results ZIP | `/advance/multi/ds/rxMer/results/{operation_id}` |
| Run Analysis | `/advance/multi/ds/rxMer/analysis` |

| Captured Output | Sanitized JSON |
| --- | --- |
| Start response | [advanced-rxmer-start.sanitized.json](../examples/live-captures/advanced-rxmer-start.sanitized.json) |
| Final status response | [advanced-rxmer-status.sanitized.json](../examples/live-captures/advanced-rxmer-status.sanitized.json) |
| Analysis `min-avg-max` | [advanced-rxmer-analysis-min-avg-max.sanitized.json](../examples/live-captures/advanced-rxmer-analysis-min-avg-max.sanitized.json) |
| Analysis `rxmer-heat-map` | [advanced-rxmer-analysis-rxmer-heat-map.sanitized.json](../examples/live-captures/advanced-rxmer-analysis-rxmer-heat-map.sanitized.json) |
| Analysis `echo-reflection-1` | [advanced-rxmer-analysis-echo-reflection-1.sanitized.json](../examples/live-captures/advanced-rxmer-analysis-echo-reflection-1.sanitized.json) |
| Analysis `ofdm-profile-performance-1` | [advanced-rxmer-analysis-ofdm-profile-performance-1.sanitized.json](../examples/live-captures/advanced-rxmer-analysis-ofdm-profile-performance-1.sanitized.json) |

### Advanced Channel Estimation

| Form Action | Endpoint |
| --- | --- |
| Start Capture | `/advance/multi/ds/channelEstimation/start` |
| Status | `/advance/multi/ds/channelEstimation/status/{operation_id}` |
| Results ZIP | `/advance/multi/ds/channelEstimation/results/{operation_id}` |
| Run Analysis | `/advance/multi/ds/channelEstimation/analysis` |

| Captured Output | Sanitized JSON |
| --- | --- |
| Start response | [advanced-channel-estimation-start.sanitized.json](../examples/live-captures/advanced-channel-estimation-start.sanitized.json) |
| Final status response | [advanced-channel-estimation-status.sanitized.json](../examples/live-captures/advanced-channel-estimation-status.sanitized.json) |
| Analysis `min-avg-max` | [advanced-channel-estimation-analysis-min-avg-max.sanitized.json](../examples/live-captures/advanced-channel-estimation-analysis-min-avg-max.sanitized.json) |
| Analysis `group-delay` | [advanced-channel-estimation-analysis-group-delay.sanitized.json](../examples/live-captures/advanced-channel-estimation-analysis-group-delay.sanitized.json) |
| Analysis `lte-detection-phase-slope` | [advanced-channel-estimation-analysis-lte-detection-phase-slope.sanitized.json](../examples/live-captures/advanced-channel-estimation-analysis-lte-detection-phase-slope.sanitized.json) |
| Analysis `echo-detection-ifft` | [advanced-channel-estimation-analysis-echo-detection-ifft.sanitized.json](../examples/live-captures/advanced-channel-estimation-analysis-echo-detection-ifft.sanitized.json) |

### Advanced OFDMA PreEq

| Form Action | Endpoint |
| --- | --- |
| Start Capture | `/advance/multi/us/ofdmaPreEqualization/start` |
| Status | `/advance/multi/us/ofdmaPreEqualization/status/{operation_id}` |
| Results ZIP | `/advance/multi/us/ofdmaPreEqualization/results/{operation_id}` |
| Run Analysis | `/advance/multi/us/ofdmaPreEqualization/analysis` |

| Captured Output | Sanitized JSON |
| --- | --- |
| Start response | [advanced-ofdma-pre-eq-start.sanitized.json](../examples/live-captures/advanced-ofdma-pre-eq-start.sanitized.json) |
| Final status response | [advanced-ofdma-pre-eq-status.sanitized.json](../examples/live-captures/advanced-ofdma-pre-eq-status.sanitized.json) |
| Analysis `min-avg-max` | [advanced-ofdma-pre-eq-analysis-min-avg-max.sanitized.json](../examples/live-captures/advanced-ofdma-pre-eq-analysis-min-avg-max.sanitized.json) |
| Analysis `group-delay` | [advanced-ofdma-pre-eq-analysis-group-delay.sanitized.json](../examples/live-captures/advanced-ofdma-pre-eq-analysis-group-delay.sanitized.json) |
| Analysis `echo-detection-ifft` | [advanced-ofdma-pre-eq-analysis-echo-detection-ifft.sanitized.json](../examples/live-captures/advanced-ofdma-pre-eq-analysis-echo-detection-ifft.sanitized.json) |

## Capture Index

- Full run summary: [summary.json](../examples/live-captures/summary.json)
