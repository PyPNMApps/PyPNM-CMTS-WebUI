import { AdvancedChannelEstEchoDetectionView } from "@/features/advanced/AdvancedChannelEstEchoDetectionView";
import type { AdvancedMultiChanEstAnalysisResponse, AdvancedMultiUsOfdmaPreEqAnalysisResponse } from "@/types/api";

export function AdvancedOfdmaPreEqEchoDetectionView({ response }: { response: AdvancedMultiUsOfdmaPreEqAnalysisResponse }) {
  return <AdvancedChannelEstEchoDetectionView response={response as unknown as AdvancedMultiChanEstAnalysisResponse} />;
}
