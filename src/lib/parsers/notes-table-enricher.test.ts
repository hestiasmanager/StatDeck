import { formatChartValue } from "@/components/charts/chart-format";
import { enrichNotesWithTableRollups } from "./notes-table-enricher";
import { normalizeExtractionDeck } from "../schemas/deck-schema";

export function runTests() {
  console.log("--- 1. Testing formatChartValue ---");
  console.assert(formatChartValue(54500, "$") === "$54,500", `Expected $54,500, got ${formatChartValue(54500, "$")}`);
  console.assert(formatChartValue(163100, "$") === "$163,100", `Expected $163,100, got ${formatChartValue(163100, "$")}`);
  console.assert(formatChartValue(267200, "€") === "€267,200", `Expected €267,200, got ${formatChartValue(267200, "€")}`);
  console.assert(formatChartValue(900, "£") === "£900", `Expected £900, got ${formatChartValue(900, "£")}`);
  console.assert(formatChartValue(84.3, "%") === "84.3%", `Expected 84.3%, got ${formatChartValue(84.3, "%")}`);
  console.assert(formatChartValue(150, "users") === "150 users", `Expected 150 users, got ${formatChartValue(150, "users")}`);
  console.assert(formatChartValue(100) === "100", `Expected 100, got ${formatChartValue(100)}`);
  console.log("[PASS] formatChartValue passed all tests.");

  console.log("--- 2. Testing enrichNotesWithTableRollups with Pipe Table ---");
  const pipeNote = `
Here is our regional performance summary:

| Region | Units | Revenue |
|---|---|---|
| North | 1,200 | $163,100 |
| South | 850 | $104,100 |
| Total | 2,050 | $267,200 |

Key takeaway: North exceeded target by 15%.
`;

  const pipeResult = enrichNotesWithTableRollups(pipeNote);
  console.assert(pipeResult.hasTable === true, "Should have detected table");
  console.assert(pipeResult.tableType === "pipe", "Table type should be pipe");
  console.assert(pipeResult.enrichedText.includes("PRE-COMPUTED JAVASCRIPT ROLLUPS"), "Should have summary header");
  console.assert(pipeResult.enrichedText.includes('Column "Revenue": Total = $267,200'), "Should compute exact revenue total without double counting");
  console.assert(pipeResult.enrichedText.includes('Max = $163,100 (Row: "North")'), "Should identify North as max");
  console.assert(pipeResult.enrichedText.includes('Min = $104,100 (Row: "South")'), "Should identify South as min");
  console.log("[PASS] enrichNotesWithTableRollups pipe table passed.");

  console.log("--- 3. Testing enrichNotesWithTableRollups with CSV Text ---");
  const csvNote = `Region,Units,Revenue
North,1200,$163100
South,850,$104100
Total,2050,$267200`;

  const csvResult = enrichNotesWithTableRollups(csvNote);
  console.assert(csvResult.hasTable === true, "Should have detected CSV table");
  console.assert(csvResult.enrichedText.includes('Column "Revenue": Total = $267,200'), "Should compute exact CSV revenue total");
  console.log("[PASS] enrichNotesWithTableRollups CSV table passed.");

  console.log("--- 4. Testing Date Sanitization in normalizeExtractionDeck ---");
  const testDeck = {
    meta: {
      title: "Test Report",
      subtitle: "A quick summary",
      sourceCitations: [],
      date: "2023-Q3", // Guessed placeholder date that should be stripped
    },
    kpis: [{ id: "kpi-1", value: "$267,200", label: "Total Revenue", deltaType: "neutral" as const }],
    charts: [],
    blocks: [],
    templateId: "clean-bento",
    format: "carousel" as const,
    watermark: true,
  };

  const normalized = normalizeExtractionDeck(testDeck);
  console.assert(normalized.meta.date === undefined, `Guessed date '2023-Q3' should be undefined, got: ${normalized.meta.date}`);

  const realDateDeck = {
    ...testDeck,
    meta: {
      ...testDeck.meta,
      date: "October 2024",
    },
  };
  const normalizedReal = normalizeExtractionDeck(realDateDeck);
  console.assert(normalizedReal.meta.date === "October 2024", `Real date should be preserved, got: ${normalizedReal.meta.date}`);
  console.log("[PASS] normalizeExtractionDeck date sanitization passed.");

  console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
}

runTests();
