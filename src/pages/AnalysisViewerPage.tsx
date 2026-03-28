import { RxMerEchoAnalysisView } from "@/features/analysis/components/RxMerEchoAnalysisView";
import { rxmerEchoFixture } from "@/features/analysis/fixtures/rxmerEchoFixture";

export function AnalysisViewerPage() {
  return <RxMerEchoAnalysisView fixture={rxmerEchoFixture} />;
}
