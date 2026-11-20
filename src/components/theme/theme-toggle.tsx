"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppTheme, AppTheme } from "./theme-provider";
import { Sun, Moon, Zap, BookOpen, Laptop, Check } from "lucide-react";

interface ThemeOption {
  id: AppTheme;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgColor: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "light",
    label: "Light",
    sublabel: "Crisp Slate",
    icon: Sun,
    accentColor: "#2563eb",
    bgColor: "#ffffff",
  },
  {
    id: "dark",
    label: "Midnight",
    sublabel: "Deep Slate",
    icon: Moon,
    accentColor: "#38bdf8",
    bgColor: "#0f172a",
  },
  {
    id: "cyber",
    label: "Cyber OLED",
    sublabel: "Pure Pitch Black",
    icon: Zap,
    accentColor: "#10b981",
    bgColor: "#000000",
  },
  {
    id: "sepia",
    label: "Warm Editorial",
    sublabel: "Cream & Stone",
    icon: BookOpen,
    accentColor: "#d97706",
    bgColor: "#fbf8f3",
  },
  {
    id: "system",
    label: "System",
    sublabel: "Follow OS preference",
    icon: Laptop,
    accentColor: "#818cf8",
    bgColor: "#334155",
  },
];

interface ThemeToggleProps {
  size?: "sm" | "md";
  className?: string;
}

export function ThemeToggle({ size = "md", className = "" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Determine which icon to display on the trigger button
  const ActiveIcon = () => {
    if (theme === "system") {
      return resolvedTheme === "dark" ? (
        <Moon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      ) : (
        <Sun className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      );
    }
    if (theme === "dark") return <Moon className={size === "sm" ? "w-3.5 h-3.5 text-sky-400" : "w-4 h-4 text-sky-400"} />;
    if (theme === "cyber") return <Zap className={size === "sm" ? "w-3.5 h-3.5 text-emerald-400" : "w-4 h-4 text-emerald-400"} />;
    if (theme === "sepia") return <BookOpen className={size === "sm" ? "w-3.5 h-3.5 text-amber-500" : "w-4 h-4 text-amber-500"} />;
    return <Sun className={size === "sm" ? "w-3.5 h-3.5 text-amber-500" : "w-4 h-4 text-amber-500"} />;
  };

  const getThemeDisplayName = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Midnight";
      case "cyber":
        return "Cyber";
      case "sepia":
        return "Editorial";
      case "system":
        return "Auto";
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs ${
          size === "sm" ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-xs font-semibold"
        }`}
        title={`App Theme: ${getThemeDisplayName()}`}
        aria-label="Toggle application theme"
        aria-expanded={isOpen}
      >
        <ActiveIcon />
        <span className="hidden sm:inline capitalize font-medium text-[11px] text-slate-500 dark:text-slate-400">
          {getThemeDisplayName()}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Interface Theme
          </div>

          <div className="p-1 flex flex-col gap-0.5">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Visual Theme Swatch */}
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: opt.bgColor }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: opt.accentColor }}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="leading-tight">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal leading-tight">
                        {opt.sublabel}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
