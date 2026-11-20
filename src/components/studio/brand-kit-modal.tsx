"use client";

import React, { useState } from "react";
import type { BrandKit } from "@/lib/schemas/brand-kit-schema";
import { ensureWcagAaCompliance } from "@/lib/brand/color-contrast";
import { Sparkles, Globe, X, Loader2, Check, Sliders, Type, Palette } from "lucide-react";

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBrandKit: (brandKit: BrandKit) => void;
  onSaveBrandKit?: (brandKit: BrandKit) => void;
}

const POPULAR_FONT_PAIRINGS = [
  { id: "Inter", label: "Inter / Inter", description: "Modern Tech & Clean Neutral" },
  { id: "Plus Jakarta Sans", label: "Plus Jakarta Sans", description: "Contemporary SaaS & Geometric" },
  { id: "Playfair Display", label: "Playfair Display", description: "Financial & Editorial Elegance" },
  { id: "Space Grotesk", label: "Space Grotesk", description: "Developer Tools & Tech Monospace" },
  { id: "Outfit", label: "Outfit", description: "Friendly Modern Minimalist" },
  { id: "Cabinet Grotesk", label: "Cabinet Grotesk", description: "Bold Avant-Garde Editorial" },
];

export function BrandKitModal({
  isOpen,
  onClose,
  onApplyBrandKit,
  onSaveBrandKit,
}: BrandKitModalProps) {
  const [domainInput, setDomainInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [brandName, setBrandName] = useState("Custom Brand");
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [accentColor, setAccentColor] = useState("#10B981");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"scrape" | "manual">("scrape");

  if (!isOpen) return null;

  // Calculate real-time contrast against white canvas background
  const contrastCheck = ensureWcagAaCompliance(primaryColor, "#FFFFFF");

  const handleScrapeBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/brand-kit?domain=${encodeURIComponent(domainInput.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract brand kit");

      const kit: BrandKit = data.brandKit;
      setBrandName(kit.name || "Brand");
      setPrimaryColor(kit.colors.primary || "#2563EB");
      setAccentColor(kit.colors.accent || "#10B981");
      if (kit.fonts?.display) setSelectedFont(kit.fonts.display);
      if (kit.logoUrl) setLogoUrl(kit.logoUrl);
      setActiveTab("manual"); // Switch to manual controls so user can see & fine-tune
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error extracting brand kit");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    const customKit: BrandKit = {
      name: brandName,
      domain: domainInput.trim() || undefined,
      logoUrl,
      colors: {
        primary: contrastCheck.adjustedHex || primaryColor,
        secondary: "#0F172A",
        accent: accentColor,
        background: "#FFFFFF",
        surface: "#F8FAFC",
        text: "#0F172A",
      },
      fonts: {
        display: selectedFont,
        body: selectedFont,
      },
      wcagContrastRatio: contrastCheck.ratio,
      isWcagCompliant: contrastCheck.isAaCompliant,
      isDefault: false,
    };

    onApplyBrandKit(customKit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Brand Kit Architect
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("scrape")}
            className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "scrape"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            URL Auto-Extract
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "manual"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Manual Palette & Fonts
          </button>
        </div>

        {/* TAB 1: Auto Scraper */}
        {activeTab === "scrape" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter any domain (e.g. <code>stripe.com</code>, <code>linear.app</code>). StatDeck extracts logos, dominant hex colors with WCAG contrast tuning, and font pairings.
            </p>
            <form onSubmit={handleScrapeBrand} className="flex gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="e.g. stripe.com, vercel.com, linear.app"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
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
          </div>
        )}

        {/* TAB 2 & Customization Panel */}
        <div className="flex flex-col gap-3.5 pt-1">
          {/* Brand Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Brand / Company Name
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
            />
          </div>

          {/* Color Pickers: Primary & Accent */}
          <div className="grid grid-cols-2 gap-3">
            {/* Primary Color */}
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Primary Brand Color
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 font-mono bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Accent Metric Color
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 font-mono bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Font Pairing Picker */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Type className="w-3.5 h-3.5 text-blue-500" />
              <span>Typography Pairing</span>
            </div>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {POPULAR_FONT_PAIRINGS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} — {f.description}
                </option>
              ))}
            </select>
          </div>

          {/* WCAG Compliance Status Banner */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                Contrast {contrastCheck.ratio.toFixed(2)}:1
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                contrastCheck.isAaCompliant
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
              }`}
            >
              {contrastCheck.isAaCompliant ? "WCAG AA Compliant" : "Low Contrast (Auto-Adjusted)"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Apply to Canvas
            </button>
            {onSaveBrandKit && (
              <button
                type="button"
                onClick={() => {
                  const customKit: BrandKit = {
                    name: brandName,
                    domain: domainInput.trim() || undefined,
                    logoUrl,
                    colors: {
                      primary: contrastCheck.adjustedHex || primaryColor,
                      secondary: "#0F172A",
                      accent: accentColor,
                      background: "#FFFFFF",
                      surface: "#F8FAFC",
                      text: "#0F172A",
                    },
                    fonts: {
                      display: selectedFont,
                      body: selectedFont,
                    },
                    wcagContrastRatio: contrastCheck.ratio,
                    isWcagCompliant: contrastCheck.isAaCompliant,
                    isDefault: false,
                  };
                  onSaveBrandKit(customKit);
                }}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Save Kit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
