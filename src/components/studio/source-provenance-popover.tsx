"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, Quote, BookOpen, Edit2, Check, X } from "lucide-react";

interface SourceProvenancePopoverProps {
  quote?: string;
  page?: string | number;
  row?: string | number;
  side?: "top" | "bottom" | "auto";
  onUpdateCitation?: (newQuote: string, newPageOrRow: string) => void;
  accentColor?: string;
}

export function SourceProvenancePopover({
  quote,
  page,
  row,
  side = "bottom",
  onUpdateCitation,
  accentColor = "#2563EB",
}: SourceProvenancePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuote, setEditQuote] = useState(quote || "");
  const [editRef, setEditRef] = useState(String(page || row || ""));
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 288; // w-72 = 18rem = 288px
    const popoverHeight = 220; // estimated height
    const margin = 8;

    // Determine vertical placement
    let openBottom = true;
    if (side === "top") {
      openBottom = false;
    } else if (side === "bottom") {
      openBottom = true;
    } else {
      // auto: if there is not enough room at the top or rect.top < 260, open bottom
      openBottom = rect.top < 260 || rect.bottom + popoverHeight + margin <= window.innerHeight;
    }

    let top = openBottom ? rect.bottom + margin : rect.top - popoverHeight - margin;
    let left = rect.left + rect.width / 2 - popoverWidth / 2;

    // Horizontal boundary containment
    if (left < 12) left = 12;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }

    setCoords({ top, left });
  }, [side]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen, updatePosition]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const referenceText = page ? `Page ${page}` : row ? `Row ${row}` : null;
  const hasCitation = Boolean(quote || referenceText);

  const popoverContent = (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      style={
        coords
          ? {
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }
          : undefined
      }
      className={`w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left ${
        !coords
          ? side === "bottom"
            ? "absolute top-full mt-2 left-1/2 -translate-x-1/2"
            : "absolute bottom-full mb-2 left-1/2 -translate-x-1/2"
          : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Data Provenance</span>
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && onUpdateCitation && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
              title="Edit Citation"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsEditing(false);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateCitation?.(editQuote, editRef);
                setIsEditing(false);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer"
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
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
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
  );

  return (
    <div className="relative inline-flex items-center overflow-visible">
      {/* Subtle Source Trigger Badge */}
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => {
            const next = !prev;
            if (next) updatePosition();
            return next;
          });
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

      {/* Render via portal to body if available, or inline fallback */}
      {isOpen &&
        (mounted && typeof document !== "undefined" ? (
          createPortal(
            <>
              <div
                className="fixed inset-0 z-50 bg-black/5"
                onClick={() => {
                  setIsOpen(false);
                  setIsEditing(false);
                }}
              />
              {popoverContent}
            </>,
            document.body
          )
        ) : (
          popoverContent
        ))}
    </div>
  );
}
