import type { DeckAST } from "@/lib/schemas/deck-schema";

/**
 * Returns the ordered list of unique slide IDs for a DeckAST.
 * Respects ast.slideOrder if present; otherwise follows the default sequence:
 * Cover -> KPIs -> Charts -> Blocks (with comparison_table paginated into 5-row slices).
 */
export function getOrderedSlideIds(ast: DeckAST): string[] {
  const defaultIds: string[] = ["cover"];
  if (ast.kpis && ast.kpis.length > 0) {
    defaultIds.push("kpis");
  }
  ast.charts.forEach((c, idx) => {
    defaultIds.push(c.id || `chart-${idx}`);
  });
  ast.blocks.forEach((b, idx) => {
    if (b.type === "comparison_table" && b.rows && b.rows.length > 5) {
      const totalParts = Math.ceil(b.rows.length / 5);
      for (let p = 0; p < totalParts; p++) {
        defaultIds.push(`block-${idx + 1}-table-p${p + 1}`);
      }
    } else {
      defaultIds.push(b.id || `block-${idx + 1}`);
    }
  });

  defaultIds.push("outro");

  if (ast.slideOrder && ast.slideOrder.length > 0) {
    const defaultSet = new Set(defaultIds);
    // Keep only valid existing IDs in their ordered position
    const ordered = ast.slideOrder.filter((id) => defaultSet.has(id));
    const orderedSet = new Set(ordered);
    // Append any missing IDs (e.g. newly added slides)
    for (const id of defaultIds) {
      if (!orderedSet.has(id)) {
        ordered.push(id);
      }
    }
    return ordered;
  }

  return defaultIds;
}
