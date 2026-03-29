import { useState } from "react";

import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import { CHART_SERIES_PALETTE, CHART_SERIES_PALETTE_SIZE } from "@/lib/constants";
import { buildExportBaseName } from "@/lib/export/naming";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { ChartSeries } from "@/pw/features/analysis/types";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";
import type { AdvancedMultiChanEstAnalysisResponse, AdvancedMultiChanEstMinAvgMaxResult } from "@/types/api";

function buildMinAvgMaxSeries(channel: AdvancedMultiChanEstMinAvgMaxResult): ChartSeries[] {
  const frequency = channel.frequency ?? [];
  return [
    {
      label: "Min",
      color: "#ef4444",
      points: frequency.slice(0, channel.min.length).map((value, index) => ({ x: value / 1_000_000, y: channel.min[index] ?? 0 })),
    },
    {
      label: "Avg",
      color: "#79a9ff",
      points: frequency.slice(0, channel.avg.length).map((value, index) => ({ x: value / 1_000_000, y: channel.avg[index] ?? 0 })),
    },
    {
      label: "Max",
      color: "#58d0a7",
      points: frequency.slice(0, channel.max.length).map((value, index) => ({ x: value / 1_000_000, y: channel.max[index] ?? 0 })),
    },
  ];
}

function buildAlignedAverageSeries(results: AdvancedMultiChanEstMinAvgMaxResult[]): ChartSeries[] {
  return results.map((channel, index) => ({
    label: `Channel ${channel.channel_id ?? index}`,
    color: CHART_SERIES_PALETTE[index % CHART_SERIES_PALETTE_SIZE],
    points: (channel.frequency ?? []).slice(0, (channel.avg ?? []).length).map((value, pointIndex) => ({
      x: value / 1_000_000,
      y: channel.avg[pointIndex] ?? 0,
    })),
  }));
}

export function AdvancedChannelEstMinAvgMaxView({ response }: { response: AdvancedMultiChanEstAnalysisResponse }) {
  const results = (response.data?.results ?? []) as AdvancedMultiChanEstMinAvgMaxResult[];
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
      <Panel title="All Channels · Avg Aligned by Frequency">
        <LineAnalysisChart
          title="All Channels Aligned by Frequency"
          subtitle={`Channels: ${results.length}`}
          yLabel="RMER Chan Est (dB)"
          series={buildAlignedAverageSeries(results)}
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
          exportBaseName={buildExportBaseName(macAddress, undefined, "advanced-channel-estimation-min-avg-max-all-channels")}
        />
      </Panel>
      <div className="if31-ds-ofdm-channel-grid">
        {results.map((channel, channelIndex) => (
          <Panel key={channel.channel_id} title={`Channel ${channel.channel_id}`}>
            <LineAnalysisChart
              title="Min / Avg / Max"
              subtitle="Per-subcarrier Channel Estimation summary"
              yLabel="dB"
              series={buildMinAvgMaxSeries(channel)}
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
              exportBaseName={buildExportBaseName(macAddress, undefined, `advanced-channel-estimation-min-avg-max-channel-${channel.channel_id}`)}
            />
          </Panel>
        ))}
      </div>
    </div>
  );
}
