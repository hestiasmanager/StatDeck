"use client";

import React, { useState } from "react";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { EDITORIAL_THEMES, DEFAULT_THEME_ID } from "@/lib/themes/registry";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { buildCarouselSlides } from "@/components/canvas/carousel-slides";

interface CarouselCanvasProps {
  ast: DeckAST;
  onUpdateText?: (path: string, newText: string) => void;
  scale?: number;
}

export function CarouselCanvas({ ast, onUpdateText, scale = 1 }: CarouselCanvasProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const theme = EDITORIAL_THEMES[ast.templateId] || EDITORIAL_THEMES[DEFAULT_THEME_ID];

  // Construct Slides Sequence
  const slides = buildCarouselSlides(ast, onUpdateText);

  // Deck identity tracking to reset slide index back to 0 whenever a new deck is synthesized
  const deckKey =
    ast.id ||
    `${ast.meta.title}-${ast.meta.date || ""}-${ast.kpis?.length ?? 0}-${ast.charts?.length ?? 0}-${ast.blocks?.length ?? 0}`;
  const [prevDeckKey, setPrevDeckKey] = useState(deckKey);

  if (prevDeckKey !== deckKey) {
    setPrevDeckKey(deckKey);
    setCurrentSlideIndex(0);
  }

  // Clamped slide index guaranteed to stay within [0, slides.length - 1]
  const safeSlideIndex = Math.min(currentSlideIndex, Math.max(0, slides.length - 1));
  if (currentSlideIndex > safeSlideIndex) {
    setCurrentSlideIndex(safeSlideIndex);
  }

  const activeSlide = slides[safeSlideIndex] || slides[0];

  return (
    <div className="flex flex-col items-center gap-4 my-auto py-2">
      {/* 4:5 Aspect Ratio Container with Scale */}
      <div
        className="relative flex items-center justify-center transition-all duration-200"
        style={{
          width: `${540 * scale}px`,
          height: `${675 * scale}px`,
        }}
      >
        <div
          id="carousel-active-slide"
          data-statdeck-canvas="carousel"
          className="relative w-[540px] h-[675px] rounded-2xl shadow-2xl overflow-hidden border transition-all duration-200 flex-shrink-0"
          style={{
            backgroundColor: theme.bg,
            borderColor: theme.surfaceBorder,
            color: theme.ink,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {activeSlide.content}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-md text-xs font-medium z-10">
        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
          disabled={safeSlideIndex === 0}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="flex items-center gap-1.5 font-mono">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          Slide {safeSlideIndex + 1} of {slides.length}
        </span>

        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={safeSlideIndex >= slides.length - 1}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
