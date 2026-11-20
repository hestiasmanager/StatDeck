"use client";

import React, { useState } from "react";
import { EDITORIAL_THEMES, getThemeTokens } from "@/lib/themes/registry";
import type { ThemeTokens } from "@/lib/themes/types";
import { Palette, Check, ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";

interface ThemePickerProps {
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
  onOpenGallery?: () => void;
}

function getThemeFontLabel(theme: ThemeTokens): string {
  if (theme.fontDisplay.includes("Instrument Serif")) return "Instrument Serif";
  if (theme.fontDisplay.includes("Fraunces")) return "Fraunces";
  if (theme.fontDisplay.includes("JetBrains Mono")) return "JetBrains Mono";
  if (theme.fontDisplay.includes("Plus Jakarta Sans")) return "Plus Jakarta";
  if (theme.fontDisplay.includes("Cormorant")) return "Cormorant";
  if (theme.fontDisplay.includes("Space Grotesk")) return "Space Grotesk";
  if (theme.fontDisplay.includes("Helvetica")) return "Helvetica";
  if (theme.fontDisplay.includes("IBM Plex")) return "IBM Plex Mono";
  if (theme.fontDisplay.includes("Syne")) return "Syne";
  return "Inter";
}

export function ThemePicker({ currentThemeId, onSelectTheme, onOpenGallery }: ThemePickerProps) {
  const [filter, setFilter] = useState<"all" | "minimal" | "dark" | "editorial" | "bold">("all");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const allThemes = Object.values(EDITORIAL_THEMES);
  const activeTheme = getThemeTokens(currentThemeId);

  const filteredThemes = filter === "all"
    ? allThemes
    : allThemes.filter((t) => t.category === filter);

  const handleSelectTheme = (themeId: string) => {
    if (currentThemeId.includes(":")) {
      const parts = currentThemeId.split(":");
      const layout = parts[0];
      const surface = parts[2] || "elevated-soft";
      onSelectTheme(`${layout}:${themeId}:${surface}`);
    } else {
      onSelectTheme(themeId);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header with Collapsible Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider transition-colors"
        >
          <Palette className="w-3.5 h-3.5 text-blue-500" />
          <span>Editorial Theme</span>
          {isCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
          )}
        </button>

        {/* Compact Active Theme Preview Pill */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full shadow-2xs" style={{ backgroundColor: activeTheme.accent }} />
          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
            {activeTheme.name}
          </span>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Segmented Category Filter */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/60 text-[11px]">
            {(["all", "minimal", "dark", "editorial", "bold"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-1 py-1 rounded-md capitalize font-medium transition-all text-center ${
                  filter === cat
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {filteredThemes.map((theme) => {
              const isSelected = activeTheme.id === theme.id;
              const fontLabel = getThemeFontLabel(theme);
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`flex flex-col gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500/50 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {theme.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                  </div>

                  {/* Font pairing subtitle */}
                  <span className="text-[10px] text-slate-400 font-medium truncate -mt-1 block">
                    {fontLabel}
                  </span>

                  {/* 3 Color Swatch Dots */}
                  <div className="flex items-center gap-1.5 mt-auto pt-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs"
                      style={{ backgroundColor: theme.bg }}
                      title="Background"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs"
                      style={{ backgroundColor: theme.accent }}
                      title="Accent"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs"
                      style={{ backgroundColor: theme.ink }}
                      title="Ink"
                    />
                    <span className="text-[10px] text-slate-400 capitalize ml-auto font-mono">
                      {theme.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {onOpenGallery && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenGallery();
              }}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
              <span>Browse 288+ Templates Gallery</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
