import { useState } from "react";

import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import { normalizeGroupDelayUs } from "@/pw/features/advanced/groupDelayUtils";
import { CHART_SERIES_PALETTE, CHART_SERIES_PALETTE_SIZE } from "@/lib/constants";
import { buildExportBaseName } from "@/lib/export/naming";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { ChartSeries } from "@/pw/features/analysis/types";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";
import type { AdvancedMultiChanEstAnalysisResponse, AdvancedMultiChanEstGroupDelayResult } from "@/types/api";

function buildSeries(channel: AdvancedMultiChanEstGroupDelayResult): ChartSeries[] {
  const normalizedGroupDelay = normalizeGroupDelayUs(channel.group_delay_us ?? []);
  return [
    {
      label: `Channel ${channel.channel_id}`,
      color: "#79a9ff",
      points: (channel.frequency ?? []).slice(0, normalizedGroupDelay.length).map((value, index) => ({
        x: value / 1_000_000,
        y: normalizedGroupDelay[index] ?? 0,
      })),
    },
  ];
}

function buildAlignedSeries(results: AdvancedMultiChanEstGroupDelayResult[]): ChartSeries[] {
  return results.map((channel, index) => {
    const normalizedGroupDelay = normalizeGroupDelayUs(channel.group_delay_us ?? []);
    return {
      label: `Channel ${channel.channel_id ?? index}`,
      color: CHART_SERIES_PALETTE[index % CHART_SERIES_PALETTE_SIZE],
      points: (channel.frequency ?? []).slice(0, normalizedGroupDelay.length).map((value, pointIndex) => ({
        x: value / 1_000_000,
        y: normalizedGroupDelay[pointIndex] ?? 0,
      })),
    };
  });
}

export function AdvancedChannelEstGroupDelayView({ response }: { response: AdvancedMultiChanEstAnalysisResponse }) {
  const results = (response.data?.results ?? []) as AdvancedMultiChanEstGroupDelayResult[];
  const macAddress = response.device?.mac_address ?? response.mac_address;
  const [allChannelsSelection, setAllChannelsSelection] = useState<SpectrumSelectionRange | null>(null);
  const [allChannelsZoomDomain, setAllChannelsZoomDomain] = useState<[number, number] | null>(null);
  const [channelSelection, setChannelSelection] = useState<Record<number, SpectrumSelectionRange | null>>({});
  const [channelZoomDomain, setChannelZoomDomain] = useState<Record<number, [number, number] | null>>({});
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />
      <Panel title="All Channels · Group Delay Aligned by Frequency">
        <LineAnalysisChart
          title="All Channels Aligned by Frequency"
          subtitle={`Channels: ${results.length}`}
          yLabel="Group Delay (us)"
          series={buildAlignedSeries(results)}
          xDomain={allChannelsZoomDomain ?? undefined}
          enableRangeSelection
          selection={allChannelsSelection}
          onSelectionChange={setAllChannelsSelection}
          selectionActions={(
            <SpectrumSelectionActions
              selection={allChannelsSelection}
              hasZoomDomain={allChannelsZoomDomain !== null}
              showIntegratedPower={false}
              onApplyZoom={(domain) => setAllChannelsZoomDomain(domain)}
              onResetZoom={() => setAllChannelsZoomDomain(null)}
            />
          )}
          exportBaseName={buildExportBaseName(macAddress, undefined, "advanced-channel-estimation-group-delay-all-channels")}
        />
      </Panel>
      <div className="if31-ds-ofdm-channel-grid">
        {results.map((channel, channelIndex) => (
          <Panel key={channel.channel_id} title={`Channel ${channel.channel_id}`}>
            <LineAnalysisChart
              title="Group Delay"
              subtitle="Per-subcarrier group delay"
              yLabel="Group Delay (us)"
              series={buildSeries(channel)}
              xDomain={channelZoomDomain[channel.channel_id ?? channelIndex] ?? undefined}
              enableRangeSelection
              selection={channelSelection[channel.channel_id ?? channelIndex] ?? null}
              onSelectionChange={(nextSelection) => setChannelSelection((current) => ({
                ...current,
                [channel.channel_id ?? channelIndex]: nextSelection,
              }))}
              selectionActions={(
                <SpectrumSelectionActions
                  selection={channelSelection[channel.channel_id ?? channelIndex] ?? null}
                  hasZoomDomain={(channelZoomDomain[channel.channel_id ?? channelIndex] ?? null) !== null}
                  showIntegratedPower={false}
                  onApplyZoom={(domain) => setChannelZoomDomain((current) => ({
                    ...current,
                    [channel.channel_id ?? channelIndex]: domain,
                  }))}
                  onResetZoom={() => setChannelZoomDomain((current) => ({
                    ...current,
                    [channel.channel_id ?? channelIndex]: null,
                  }))}
                />
              )}
              exportBaseName={buildExportBaseName(macAddress, undefined, `advanced-channel-estimation-group-delay-channel-${channel.channel_id}`)}
            />
          </Panel>
        ))}
      </div>
    </div>
  );
}
