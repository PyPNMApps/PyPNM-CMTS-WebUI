import { AdvancedChannelEstGroupDelayView } from "@/features/advanced/AdvancedChannelEstGroupDelayView";
import type { AdvancedMultiChanEstAnalysisResponse, AdvancedMultiUsOfdmaPreEqAnalysisResponse } from "@/types/api";

export function AdvancedOfdmaPreEqGroupDelayView({ response }: { response: AdvancedMultiUsOfdmaPreEqAnalysisResponse }) {
  return <AdvancedChannelEstGroupDelayView response={response as unknown as AdvancedMultiChanEstAnalysisResponse} />;
}
