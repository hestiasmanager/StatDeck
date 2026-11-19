"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Check,
  Sparkles,
  LayoutGrid,
  Filter,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  getCombinatorialTemplates,
  STRUCTURAL_LAYOUTS,
  CURATED_THEMES,
  SURFACE_STYLES,
  type TemplateCategory,
  type CuratedPresetCombination,
} from "@/lib/templates/matrix";

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateGalleryModal({
  isOpen,
  onClose,
  currentTemplateId,
  onSelectTemplate,
}: TemplateGalleryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("all");
  const [selectedSurfaceFilter, setSelectedSurfaceFilter] = useState<string>("all");

  const allTemplates = useMemo(() => getCombinatorialTemplates(), []);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((tmpl) => {
      // Category filter
      if (selectedCategory !== "all" && tmpl.category !== selectedCategory) {
        return false;
      }
      // Surface filter
      if (selectedSurfaceFilter !== "all" && tmpl.surfaceId !== selectedSurfaceFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const layout = STRUCTURAL_LAYOUTS[tmpl.layoutId];
        const theme = CURATED_THEMES[tmpl.themeId];
        const matchName = tmpl.name.toLowerCase().includes(q);
        const matchLayout = layout?.name.toLowerCase().includes(q) || layout?.tagline.toLowerCase().includes(q);
        const matchTheme = theme?.name.toLowerCase().includes(q) || theme?.description.toLowerCase().includes(q);
        const matchCategory = tmpl.category.toLowerCase().includes(q);
        return matchName || matchLayout || matchTheme || matchCategory;
      }
      return true;
    });
  }, [allTemplates, selectedCategory, selectedSurfaceFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Template Gallery
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                  288 Combinations
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                12 structural layouts paired with 24 WCAG AAA industry palettes and 4 card surface finishes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by layout, theme, or industry (e.g. 'fintech', 'pitch', 'scorecard')..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Industry Category Segmented Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
            {(
              [
                { id: "all", label: "All Use Cases" },
                { id: "saas", label: "SaaS & Tech" },
                { id: "finance", label: "Finance & Ops" },
                { id: "creators", label: "Creators" },
                { id: "consulting", label: "Consulting" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing {filteredTemplates.length} matching commercial templates
            </span>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Filter className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No templates matched &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.slice(0, 72).map((tmpl) => {
                const layout = STRUCTURAL_LAYOUTS[tmpl.layoutId];
                const theme = CURATED_THEMES[tmpl.themeId];
                const surface = SURFACE_STYLES[tmpl.surfaceId];
                const isSelected =
                  currentTemplateId === tmpl.id ||
                  currentTemplateId === tmpl.themeId ||
                  currentTemplateId.startsWith(`${tmpl.layoutId}:${tmpl.themeId}`);

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      onSelectTemplate(tmpl.id);
                      onClose();
                    }}
                    className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/30 bg-white dark:bg-slate-900"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/90"
                    }`}
                  >
                    {/* Visual Card Preview Mini-Mockup */}
                    <div
                      className="w-full h-28 rounded-lg p-3 flex flex-col justify-between mb-3 border relative overflow-hidden transition-all group-hover:scale-[1.01]"
                      style={{
                        backgroundColor: theme.bg,
                        borderColor: theme.surfaceBorder,
                      }}
                    >
                      {/* Top Bar with Badge */}
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase"
                          style={{
                            backgroundColor: `${theme.accent}18`,
                            color: theme.accent,
                          }}
                        >
                          {layout.badgeText}
                        </span>
                        {/* Swatch dots */}
                        <div className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: theme.accent }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: theme.surface }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: theme.ink }}
                          />
                        </div>
                      </div>

                      {/* Mini Metric Card Wireframe */}
                      <div className="grid grid-cols-3 gap-1.5 my-auto">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="p-1.5 rounded-md border text-center"
                            style={{
                              backgroundColor: theme.surface,
                              borderColor: theme.surfaceBorder,
                              borderRadius: theme.cardRadius || "6px",
                            }}
                          >
                            <div
                              className="w-6 h-2 rounded-xs mx-auto mb-1"
                              style={{ backgroundColor: theme.accent }}
                            />
                            <div
                              className="w-8 h-1 rounded-xs mx-auto opacity-40"
                              style={{ backgroundColor: theme.ink }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Mini Footer Rule */}
                      <div
                        className="w-10 h-0.5 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                      />
                    </div>

                    {/* Metadata & Selection Button */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tmpl.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {layout.tagline}
                        </p>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-slate-500">
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Click any card to instantly apply the layout and color palette across your deck.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
