"use client";

import React, { useState } from "react";
import { EDITORIAL_THEMES } from "@/lib/themes/registry";
import { Palette, Check, Sparkles } from "lucide-react";

interface ThemePickerProps {
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

export function ThemePicker({ currentThemeId, onSelectTheme }: ThemePickerProps) {
  const [filter, setFilter] = useState<"all" | "minimal" | "dark" | "editorial" | "bold">("all");
  const allThemes = Object.values(EDITORIAL_THEMES);

  const filteredThemes = filter === "all"
    ? allThemes
    : allThemes.filter((t) => t.category === filter);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Palette className="w-3.5 h-3.5 text-blue-500" />
          <span>Editorial Theme</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">12 Presets</span>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px]">
        {(["all", "minimal", "dark", "editorial", "bold"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-2 py-0.5 rounded-full capitalize font-medium transition-all ${
              filter === cat
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
        {filteredThemes.map((theme) => {
          const isSelected = currentThemeId === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              className={`flex flex-col gap-1.5 p-2 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-blue-500/50 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {theme.name}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
              </div>

              {/* Color Swatch Dots */}
              <div className="flex items-center gap-1.5 mt-auto">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: theme.bg }}
                  title="Background"
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: theme.accent }}
                  title="Accent"
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
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
    </div>
  );
}
