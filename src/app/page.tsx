import { StudioContainer } from "@/components/studio/studio-container";
import { SAMPLE_PRESETS } from "@/lib/ai/presets";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <StudioContainer initialAst={SAMPLE_PRESETS["saas-churn-metrics"]} />
    </div>
  );
}
