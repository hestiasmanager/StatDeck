"use client";

import React from "react";
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Scan } from "lucide-react";

interface ZoomToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToScreen: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function ZoomToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  isFullscreen,
  onToggleFullscreen,
}: ZoomToolbarProps) {
  const percentText = `${Math.round(zoom * 100)}%`;

  return (
    <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-lg text-xs font-medium text-slate-700 dark:text-slate-300 z-30 transition-all">
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.4}
        title="Zoom Out (Ctrl -)"
        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
        aria-label="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      {/* Current Zoom Percent (Click to Reset) */}
      <button
        onClick={onResetZoom}
        title="Reset to 100%"
        className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[42px] text-center"
      >
        {percentText}
      </button>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={zoom >= 1.6}
        title="Zoom In (Ctrl +)"
        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
        aria-label="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Fit to Screen */}
      <button
        onClick={onFitToScreen}
        title="Fit to Screen"
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Scan className="w-3.5 h-3.5 text-blue-500" />
        <span>Fit</span>
      </button>

      <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Maximize / Fullscreen Mode */}
      <button
        onClick={onToggleFullscreen}
        title={isFullscreen ? "Exit Fullscreen" : "Maximize Canvas (Distraction-Free)"}
        className="flex items-center gap-1 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        aria-label={isFullscreen ? "Exit Fullscreen" : "Maximize Canvas"}
      >
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
