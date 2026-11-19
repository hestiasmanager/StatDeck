"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Layers,
  ScrollText,
  Monitor,
  Download,
  LayoutGrid,
  Sparkles,
  Undo2,
  Redo2,
  Maximize2,
  Scan,
  Plus,
  X,
  Keyboard,
} from "lucide-react";
import type { OutputFormat } from "@/lib/schemas/deck-schema";

interface CommandItem {
  id: string;
  category: "Format" | "Templates" | "Export" | "Slides" | "Studio";
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSetFormat: (format: OutputFormat) => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitToScreen: () => void;
  onToggleFullscreen: () => void;
  onAddSlide?: (type: "chart" | "kpi" | "takeaways" | "table") => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSetFormat,
  onOpenTemplates,
  onOpenExport,
  onUndo,
  onRedo,
  onFitToScreen,
  onToggleFullscreen,
  onAddSlide,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "format-carousel",
        category: "Format",
        label: "Switch to LinkedIn Carousel",
        sublabel: "4:5 Portrait Swipeable Document",
        icon: <Layers className="w-4 h-4 text-blue-500" />,
        shortcut: "1",
        action: () => onSetFormat("carousel"),
      },
      {
        id: "format-infographic",
        category: "Format",
        label: "Switch to Infographic",
        sublabel: "Long-form Vertical Poster",
        icon: <ScrollText className="w-4 h-4 text-emerald-500" />,
        shortcut: "2",
        action: () => onSetFormat("infographic"),
      },
      {
        id: "format-presentation",
        category: "Format",
        label: "Switch to Presentation Deck",
        sublabel: "16:9 Landscape Slide Deck",
        icon: <Monitor className="w-4 h-4 text-purple-500" />,
        shortcut: "3",
        action: () => onSetFormat("presentation"),
      },
      {
        id: "templates-gallery",
        category: "Templates",
        label: "Open Template Gallery",
        sublabel: "Browse 288+ layouts, themes, and surfaces",
        icon: <LayoutGrid className="w-4 h-4 text-amber-500" />,
        shortcut: "T",
        action: onOpenTemplates,
      },
      {
        id: "export-assets",
        category: "Export",
        label: "Export Presentation Assets",
        sublabel: "PowerPoint (.pptx), PDF (.pdf), ZIP (.zip), PNG, SVG",
        icon: <Download className="w-4 h-4 text-blue-500" />,
        shortcut: "E",
        action: onOpenExport,
      },
      {
        id: "studio-fit",
        category: "Studio",
        label: "Fit Canvas to Viewport",
        sublabel: "Calculate optimum scale with 32px margins",
        icon: <Scan className="w-4 h-4 text-cyan-500" />,
        shortcut: "F",
        action: onFitToScreen,
      },
      {
        id: "studio-fullscreen",
        category: "Studio",
        label: "Toggle Fullscreen Presentation Mode",
        sublabel: "Distraction-free pitch display",
        icon: <Maximize2 className="w-4 h-4 text-slate-500" />,
        shortcut: "Esc",
        action: onToggleFullscreen,
      },
      {
        id: "edit-undo",
        category: "Studio",
        label: "Undo Last Action",
        sublabel: "Revert text or theme changes",
        icon: <Undo2 className="w-4 h-4 text-slate-500" />,
        shortcut: "⌘Z",
        action: onUndo,
      },
      {
        id: "edit-redo",
        category: "Studio",
        label: "Redo Last Action",
        sublabel: "Restore reverted edits",
        icon: <Redo2 className="w-4 h-4 text-slate-500" />,
        shortcut: "⇧⌘Z",
        action: onRedo,
      },
      {
        id: "slide-add-chart",
        category: "Slides",
        label: "Add Visual Chart Slide",
        sublabel: "Bar, Donut, Line, or Area chart",
        icon: <Plus className="w-4 h-4 text-blue-500" />,
        action: () => onAddSlide?.("chart"),
      },
      {
        id: "slide-add-kpi",
        category: "Slides",
        label: "Add Core Metrics Slide",
        sublabel: "4-card key performance indicators",
        icon: <Plus className="w-4 h-4 text-emerald-500" />,
        action: () => onAddSlide?.("kpi"),
      },
      {
        id: "slide-add-takeaways",
        category: "Slides",
        label: "Add Key Takeaways Slide",
        sublabel: "Checkmark highlight framework",
        icon: <Plus className="w-4 h-4 text-amber-500" />,
        action: () => onAddSlide?.("takeaways"),
      },
    ],
    [onSetFormat, onOpenTemplates, onOpenExport, onUndo, onRedo, onFitToScreen, onToggleFullscreen, onAddSlide]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.sublabel?.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action (e.g. 'export', 'carousel', 'templates')..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
            autoFocus
          />
          <kbd className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500">
            Esc
          </kbd>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching commands found for &quot;{query}&quot;.
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors">
                      {cmd.icon}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                        {cmd.label}
                      </span>
                      {cmd.sublabel && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {cmd.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-blue-500" />
            <span>Use Cmd+K to open anywhere in StatDeck</span>
          </div>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
