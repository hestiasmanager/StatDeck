"use client";

import React, { useState } from "react";
import type { BrandKit } from "@/lib/schemas/brand-kit-schema";
import { Sparkles, Globe, X, Loader2, Check } from "lucide-react";

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBrandKit: (brandKit: BrandKit) => void;
}

export function BrandKitModal({ isOpen, onClose, onApplyBrandKit }: BrandKitModalProps) {
  const [domainInput, setDomainInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [extractedKit, setExtractedKit] = useState<BrandKit | null>(null);

  if (!isOpen) return null;

  const handleScrapeBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/brand-kit?domain=${encodeURIComponent(domainInput.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract brand kit");
      setExtractedKit(data.brandKit);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error extracting brand kit");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (extractedKit) {
      onApplyBrandKit(extractedKit);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              URL-to-Brand-Kit Scraper
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Enter any corporate or startup domain. StatDeck will automatically extract the high-res logo, dominant brand hex colors (with WCAG AA contrast adjustments), and font pairings.
        </p>

        <form onSubmit={handleScrapeBrand} className="flex gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="e.g. linear.app, stripe.com, openai.com"
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Extract
          </button>
        </form>

        {extractedKit && (
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {extractedKit.name} Brand Kit
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                WCAG AA Compliant
              </span>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span
                  className="w-5 h-5 rounded-md border border-black/10 shadow-sm"
                  style={{ backgroundColor: extractedKit.colors.primary }}
                />
                <span className="text-[11px] text-slate-500">{extractedKit.colors.primary}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono ml-3">
                <span
                  className="w-5 h-5 rounded-md border border-black/10 shadow-sm"
                  style={{ backgroundColor: extractedKit.colors.accent }}
                />
                <span className="text-[11px] text-slate-500">{extractedKit.colors.accent}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400">
              Font Detected: <span className="font-semibold">{extractedKit.fonts.display}</span>
            </div>

            <button
              onClick={handleApply}
              className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply to Active Studio Canvas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
