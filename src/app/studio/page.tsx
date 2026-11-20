import { StudioContainer } from "@/components/studio/studio-container";
import { SAMPLE_PRESETS } from "@/lib/ai/presets";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { DeckAST } from "@/lib/schemas/deck-schema";

interface PageProps {
  searchParams: Promise<{
    id?: string;
    preset?: string;
    content?: string;
  }>;
}

export default async function StudioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let initialAst: DeckAST = SAMPLE_PRESETS["saas-churn-metrics"];

  if (params.preset && SAMPLE_PRESETS[params.preset]) {
    initialAst = SAMPLE_PRESETS[params.preset];
  } else if (params.id) {
    try {
      const [proj] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, params.id))
        .limit(1);
      if (proj && proj.ast) {
        initialAst = proj.ast;
      }
    } catch {
      // Fallback to sample preset if database query fails or offline
    }
  } else if (params.content) {
    try {
      const decoded = decodeURIComponent(params.content);
      const clone = JSON.parse(JSON.stringify(SAMPLE_PRESETS["saas-churn-metrics"])) as DeckAST;
      clone.meta.title = decoded.slice(0, 60);
      clone.executiveSummary = decoded.slice(0, 160);
      initialAst = clone;
    } catch {
      // Fallback
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StudioContainer initialAst={initialAst} />
    </div>
  );
}
