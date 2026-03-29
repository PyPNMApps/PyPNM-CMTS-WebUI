import { RxMerEchoAnalysisView } from "@/pw/features/analysis/components/RxMerEchoAnalysisView";
import { rxmerEchoFixture } from "@/pw/features/analysis/fixtures/rxmerEchoFixture";

export function AnalysisViewerPage() {
  return <RxMerEchoAnalysisView fixture={rxmerEchoFixture} />;
}
