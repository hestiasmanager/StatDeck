"use client";

import React, { useState } from "react";
import { ShieldCheck, Quote, BookOpen, Edit2, Check, X } from "lucide-react";

interface SourceProvenancePopoverProps {
  quote?: string;
  page?: string | number;
  row?: string | number;
  onUpdateCitation?: (newQuote: string, newPageOrRow: string) => void;
  accentColor?: string;
}

export function SourceProvenancePopover({
  quote,
  page,
  row,
  onUpdateCitation,
  accentColor = "#2563EB",
}: SourceProvenancePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuote, setEditQuote] = useState(quote || "");
  const [editRef, setEditRef] = useState(String(page || row || ""));

  const referenceText = page ? `Page ${page}` : row ? `Row ${row}` : null;
  const hasCitation = Boolean(quote || referenceText);

  return (
    <div className="relative inline-flex items-center">
      {/* Subtle Source Trigger Badge */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
          hasCitation
            ? "bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700"
            : "opacity-40 hover:opacity-100 text-slate-400 hover:text-slate-600"
        }`}
        title="Click to verify source citation & provenance"
      >
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        <span className="hidden sm:inline">Source</span>
      </button>

      {/* Popover Bubble */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Data Provenance</span>
            </div>
            <div className="flex items-center gap-1">
              {!isEditing && onUpdateCitation && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                  title="Edit Citation"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">
                  Verbatim Source Quote
                </label>
                <textarea
                  value={editQuote}
                  onChange={(e) => setEditQuote(e.target.value)}
                  placeholder="Paste excerpt from filing, CSV, or report"
                  rows={2}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-none font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">
                  Page or Row Reference
                </label>
                <input
                  type="text"
                  value={editRef}
                  onChange={(e) => setEditRef(e.target.value)}
                  placeholder="e.g. Page 14 or Row 42"
                  className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUpdateCitation?.(editQuote, editRef);
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
                >
                  <Check className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          ) : hasCitation ? (
            <div className="flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-300">
              {quote && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-start gap-2 italic text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  <Quote className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>&quot;{quote}&quot;</span>
                </div>
              )}

              {referenceText && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                  <BookOpen className="w-3 h-3 text-slate-400" />
                  <span>Reference: {referenceText}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-slate-500">
              <span>No citation attached yet. Click the edit icon to add source quote.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
