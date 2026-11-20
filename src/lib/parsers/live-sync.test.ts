import { normalizeGoogleSheetsUrl, refreshDeckWithCsvData } from "./live-sync";
import { SAMPLE_PRESETS } from "../ai/presets";
import type { DeckAST } from "../schemas/deck-schema";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`[PASS] ${msg}`);
}

console.log("--- 1. Testing normalizeGoogleSheetsUrl ---");
const rawSheetUrl = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing";
const normalized = normalizeGoogleSheetsUrl(rawSheetUrl);
assert(
  normalized === "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv",
  "Google Sheets edit URL correctly converted to export?format=csv"
);

const sheetWithGid = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=123456789";
const normalizedGid = normalizeGoogleSheetsUrl(sheetWithGid);
assert(
  normalizedGid.includes("&gid=123456789"),
  "Google Sheets gid parameter preserved in export URL"
);

const plainCsvUrl = "https://raw.githubusercontent.com/datasets/gdp/master/data/gdp.csv";
assert(
  normalizeGoogleSheetsUrl(plainCsvUrl) === plainCsvUrl,
  "Non-Google sheet raw CSV URLs preserved unchanged"
);

console.log("--- 2. Testing refreshDeckWithCsvData ---");
const initialDeck: DeckAST = JSON.parse(JSON.stringify(SAMPLE_PRESETS["saas-churn-metrics"]));
initialDeck.templateId = "matrix-terminal";
initialDeck.format = "carousel";

const freshCsvText = `
Department,Headcount,Budget
Engineering,140,$18,500,000
Product,35,$4,200,000
Sales,65,$8,100,000
Marketing,25,$3,400,000
Operations,15,$1,800,000
`.trim();

const refreshed = refreshDeckWithCsvData(initialDeck, freshCsvText);

assert(refreshed.templateId === "matrix-terminal", "User's chosen templateId preserved on sync");
assert(refreshed.format === "carousel", "User's format preserved on sync");
assert(refreshed.charts.length > 0, "Charts retained");
assert(refreshed.charts[0].data.length === 5, "Chart data points updated with 5 fresh CSV rows");
assert(refreshed.charts[0].data[0].label === "Engineering", "First chart label updated to Engineering");
assert(refreshed.charts[0].data[0].value === 140, "First chart value updated to 140");
assert(refreshed.kpis.length > 0, "KPIs preserved");

console.log("ALL LIVE-SYNC TESTS PASSED!");
