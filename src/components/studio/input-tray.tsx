"use client";

import React, { useState, useRef } from "react";
import {
  Link2,
  UploadCloud,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileUp,
  RotateCcw,
} from "lucide-react";
import { parseCsvFileClientSide } from "@/lib/parsers/client-csv";
import { parseExcelFileClientSide } from "@/lib/parsers/client-excel";
import { parsePdfFileClientSide } from "@/lib/parsers/client-pdf";
import { enrichNotesWithTableRollups } from "@/lib/parsers/notes-table-enricher";
import { SAMPLE_PRESETS } from "@/lib/ai/presets";
import type { DeckAST, OutputFormat } from "@/lib/schemas/deck-schema";

interface InputTrayProps {
  onAstLoaded: (ast: DeckAST, sourceInfo?: string) => void;
  currentFormat: OutputFormat;
  currentTemplateId: string;
}

interface LoadedFileInfo {
  name: string;
  rowCount?: number;
  type: string;
  sheetNames?: string[];
  activeSheet?: string;
}

function getExtractionHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

export function InputTray({ onAstLoaded, currentFormat, currentTemplateId }: InputTrayProps) {
  const [activeTab, setActiveTab] = useState<"samples" | "url" | "file" | "text">("samples");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadedFileInfo, setLoadedFileInfo] = useState<LoadedFileInfo | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Unified File Processing (Supports Drag & Drop, File Picker, and Sample Files)
  const processFile = async (file: File, sheetOverride?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(
      `Parsing ${file.name}${sheetOverride ? ` [Sheet: "${sheetOverride}"]` : ""} client-side...`
    );

    try {
      setCurrentFile(file);
      let extractedMarkdown = "";
      let rowCount: number | undefined;
      let sheetNames: string[] | undefined;
      let activeSheet: string | undefined;
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension === "csv") {
        const summary = await parseCsvFileClientSide(file);
        extractedMarkdown = summary.markdownTable;
        rowCount = summary.totalRows;
      } else if (extension === "xlsx" || extension === "xls") {
        const summary = await parseExcelFileClientSide(file, sheetOverride);
        extractedMarkdown = summary.markdownTable;
        rowCount = summary.totalRows;
        sheetNames = summary.sheetNames;
        activeSheet = summary.activeSheet;
      } else if (extension === "pdf") {
        const summary = await parsePdfFileClientSide(file);
        extractedMarkdown = summary.text;
      } else if (extension === "txt" || extension === "md" || extension === "json") {
        extractedMarkdown = await file.text();
      } else {
        throw new Error(
          `Unsupported file format (.${extension}). Please upload CSV, Excel (.xlsx/.xls), PDF, or TXT.`
        );
      }

      if (!extractedMarkdown || extractedMarkdown.trim().length < 10) {
        throw new Error("No readable text or data rows could be extracted from this file.");
      }

      setStatusMessage(
        `Designing visual slides for ${file.name}${activeSheet ? ` (${activeSheet})` : ""}...`
      );
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 60000);

      try {
        const extractRes = await fetch("/api/extract", {
          method: "POST",
          headers: getExtractionHeaders(),
          body: JSON.stringify({
            content: extractedMarkdown,
            format: currentFormat,
            templateId: currentTemplateId,
          }),
          signal: abortController.signal,
        });

        const extractData = await extractRes.json();
        if (!extractRes.ok) {
          throw new Error(extractData.error || "Failed to synthesize visual deck AST");
        }

        setLoadedFileInfo({
          name: file.name,
          rowCount,
          type: extension ? extension.toUpperCase() : "FILE",
          sheetNames,
          activeSheet,
        });

        onAstLoaded(
          extractData.ast,
          `Parsed from ${file.name}${activeSheet ? ` (${activeSheet})` : ""}`
        );
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err: unknown) {
      console.error("File processing error:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setErrorMessage(
          "File extraction timed out after 60 seconds. Please try again with a smaller dataset."
        );
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Error processing file.");
      }
    } finally {
      setIsLoading(false);
      setStatusMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  // Quick Sample CSV Loader (1-Click test for client-side pipeline)
  const handleLoadSampleCsv = () => {
    const sampleCsvContent = `Quarter,Revenue,Growth,Retention,ActiveUsers
Q1-2024,120000,15%,92%,4500
Q2-2024,145000,21%,94%,5800
Q3-2024,180000,24%,95%,7200
Q4-2024,225000,25%,96%,9100`;

    const blob = new Blob([sampleCsvContent], { type: "text/csv" });
    const sampleFile = new File([blob], "quarterly-metrics-sample.csv", { type: "text/csv" });
    processFile(sampleFile);
  };

  // 2. URL Extraction Flow
  const handleExtractUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    let targetUrl = urlInput.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage("Reading and parsing page content...");

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 60000);

    try {
      const urlRes = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
        signal: abortController.signal,
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || "Failed to parse URL content");

      setStatusMessage("Creating visual layout...");
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: getExtractionHeaders(),
        body: JSON.stringify({
          content: urlData.cleanedContent,
          format: currentFormat,
          templateId: currentTemplateId,
        }),
        signal: abortController.signal,
      });
      const extractData = await extractRes.json();
      if (!extractRes.ok) throw new Error(extractData.error || "Failed to extract visual AST");

      onAstLoaded(extractData.ast, `Extracted from ${urlData.siteName || targetUrl}`);
      setUrlInput("");
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setErrorMessage("URL extraction timed out after 60 seconds. Please try again or check the URL.");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Error processing URL");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  // 3. Raw Text Extraction Flow
  const handleExtractText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Run computeTableRollups on pasted pipe/CSV notes
    const { enrichedText, hasTable, tableType, rowCount } = enrichNotesWithTableRollups(textInput);
    if (hasTable) {
      setStatusMessage(
        `Pre-computing exact JavaScript sums for ${tableType === "pipe" ? "markdown" : "CSV"} table (${rowCount} data rows)...`
      );
    } else {
      setStatusMessage("Creating visuals from notes...");
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 60000);

    try {
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: getExtractionHeaders(),
        body: JSON.stringify({
          content: enrichedText,
          format: currentFormat,
          templateId: currentTemplateId,
        }),
        signal: abortController.signal,
      });
      const extractData = await extractRes.json();
      if (!extractRes.ok) throw new Error(extractData.error || "Failed to extract AST");

      onAstLoaded(extractData.ast, "Extracted from raw notes");
      setTextInput("");
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setErrorMessage("Extraction timed out after 60 seconds. Please try again with shorter text.");
      } else {
        setErrorMessage(err instanceof Error ? err.message : "Error processing text");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  const tabs = [
    { id: "samples", label: "Presets", icon: <Sparkles className="w-3.5 h-3.5 flex-shrink-0" /> },
    { id: "url", label: "URL", icon: <Link2 className="w-3.5 h-3.5 flex-shrink-0" /> },
    { id: "file", label: "File", icon: <UploadCloud className="w-3.5 h-3.5 flex-shrink-0" /> },
    { id: "text", label: "Notes", icon: <FileText className="w-3.5 h-3.5 flex-shrink-0" /> },
  ] as const;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3.5 flex flex-col gap-3">
      {/* 4 Tabs Segmented Grid */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Message Alert Banner */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-[11px] text-red-600 dark:text-red-400 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Error: </span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-600 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2.5 py-6 text-xs text-blue-600 dark:text-blue-400 font-medium animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {/* Tab 1: Instant Sample Presets */}
      {!isLoading && activeTab === "samples" && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onAstLoaded(SAMPLE_PRESETS["saas-churn-metrics"], "Preset: SaaS Retention")}
            className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                SaaS Retention & Churn Benchmark
              </span>
              <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                4 KPIs, Bar chart by ACV, comparison table
              </span>
            </div>
          </button>

          <button
            onClick={() => onAstLoaded(SAMPLE_PRESETS["ai-infrastructure-costs"], "Preset: LLM Inference")}
            className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                LLM Inference Economics
              </span>
              <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                Donut chart of spend, latency benchmarks
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Tab 2: URL Scraper */}
      {!isLoading && activeTab === "url" && (
        <form onSubmit={handleExtractUrl} className="flex flex-col gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste any URL (e.g. techcrunch.com/article...)"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Link2 className="w-3.5 h-3.5" />
            Extract & Visualize
          </button>
        </form>
      )}

      {/* Tab 3: Client-side Document Parser (with Drag & Drop, Explicit Upload, and Loaded Chip) */}
      {!isLoading && activeTab === "file" && (
        <div className="flex flex-col gap-2.5">
          {/* Active File Loaded Banner */}
          {loadedFileInfo && (
            <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {loadedFileInfo.name}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">
                      {loadedFileInfo.rowCount ? `${loadedFileInfo.rowCount} data rows • ` : ""}
                      {loadedFileInfo.activeSheet ? `Sheet: "${loadedFileInfo.activeSheet}" • ` : ""}
                      Parsed client-side
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  Change
                </button>
              </div>

              {/* Multi-Sheet Excel Switcher */}
              {loadedFileInfo.sheetNames && loadedFileInfo.sheetNames.length > 1 && currentFile && (
                <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/60 flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Workbook Sheets ({loadedFileInfo.sheetNames.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {loadedFileInfo.sheetNames.map((sheet) => {
                      const isSelected = sheet === loadedFileInfo.activeSheet;
                      return (
                        <button
                          key={sheet}
                          type="button"
                          onClick={() => {
                            if (!isSelected && !isLoading) {
                              processFile(currentFile, sheet);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs font-semibold"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {sheet}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all text-center ${
              isDragging
                ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]"
                : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-950/30"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
              <UploadCloud className="w-4 h-4" />
            </div>

            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {isDragging ? "Drop file right here" : "Click to browse or drag & drop"}
            </span>

            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              CSV, Excel (.xlsx/.xls), PDF, TXT • Max 10MB
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-2.5 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <FileUp className="w-3 h-3 text-blue-500" />
              Browse Files
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls, .pdf, .txt, .md, .json"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = "";
              }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
              className="hidden"
            />
          </div>

          {/* Quick 1-Click Sample CSV Tester */}
          <button
            type="button"
            onClick={handleLoadSampleCsv}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>Try with sample CSV file</span>
          </button>
        </div>
      )}

      {/* Tab 4: Raw Text Input */}
      {!isLoading && activeTab === "text" && (
        <form onSubmit={handleExtractText} className="flex flex-col gap-2">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={3}
            placeholder="Paste data, a link, or drop any messy Excel file..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Generate Visuals
          </button>
        </form>
      )}
    </div>
  );
}
