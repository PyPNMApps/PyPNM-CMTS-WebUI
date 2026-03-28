import { AdvancedChannelEstMinAvgMaxView } from "@/features/advanced/AdvancedChannelEstMinAvgMaxView";
import type { AdvancedMultiChanEstAnalysisResponse, AdvancedMultiUsOfdmaPreEqAnalysisResponse } from "@/types/api";

export function AdvancedOfdmaPreEqMinAvgMaxView({ response }: { response: AdvancedMultiUsOfdmaPreEqAnalysisResponse }) {
  return <AdvancedChannelEstMinAvgMaxView response={response as unknown as AdvancedMultiChanEstAnalysisResponse} />;
}
