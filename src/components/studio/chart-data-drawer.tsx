"use client";

import React, { useState, useEffect } from "react";
import type { ChartBlock, ChartDataPoint, ChartType } from "@/lib/schemas/deck-schema";
import {
  X,
  Plus,
  Trash2,
  Table,
  Check,
  RotateCcw,
  Sparkles,
  Palette,
  FileText,
  BarChart3,
  AlignLeft,
} from "lucide-react";

interface ChartDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chart: ChartBlock | null;
  chartIndex: number;
  onUpdateChart: (chartIndex: number, updatedChart: ChartBlock) => void;
}

export function ChartDataDrawer({
  isOpen,
  onClose,
  chart,
  chartIndex,
  onUpdateChart,
}: ChartDataDrawerProps) {
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [insight, setInsight] = useState("");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [dataPoints, setDataPoints] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (chart) {
      setTitle(chart.title || "");
      setUnit(chart.unit || "");
      setInsight(chart.chartInsight || "");
      setChartType(chart.type || "bar");
      setDataPoints(
        (chart.data || []).map((d) => ({
          ...d,
        }))
      );
    }
  }, [chart]);

  if (!isOpen || !chart) return null;

  const handleRowChange = (index: number, field: keyof ChartDataPoint, val: unknown) => {
    setDataPoints((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: val,
      };
      return copy;
    });
  };

  const handleAddRow = () => {
    setDataPoints((prev) => [
      ...prev,
      {
        label: `Item ${prev.length + 1}`,
        value: 100,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (dataPoints.length <= 2) {
      alert("A chart requires at least 2 data points.");
      return;
    }
    setDataPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndApply = () => {
    const updated: ChartBlock = {
      ...chart,
      title: title.trim() || "Untitled Chart",
      unit: unit.trim(),
      chartInsight: insight.trim() || undefined,
      type: chartType,
      data: dataPoints.map((d) => ({
        ...d,
        value: typeof d.value === "number" ? d.value : parseFloat(String(d.value)) || 0,
        secondaryValue: d.secondaryValue ? parseFloat(String(d.secondaryValue)) : undefined,
      })),
    };

    onUpdateChart(chartIndex, updated);
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Chart Data Grid
          </h3>
          <span className="text-[10px] font-mono uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
            Slide {chartIndex + 1}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Chart Headline & Unit Meta */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Chart Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Unit Label
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. $, %, M"
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Insight Strip */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>&quot;What This Shows&quot; Analytical Insight</span>
          </label>
          <textarea
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            rows={2}
            placeholder="1-2 sentences highlighting the trend or key takeaway"
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none"
          />
        </div>

        {/* Editable Mini-Spreadsheet Grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Data Series ({dataPoints.length} points)
            </span>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Plus className="w-3 h-3" />
              <span>Add Row</span>
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 text-[10px] uppercase font-bold text-slate-500 font-mono">
                  <th className="py-2 px-2.5 w-6">#</th>
                  <th className="py-2 px-2">Label</th>
                  <th className="py-2 px-2 w-24">Value</th>
                  <th className="py-2 px-2 w-16">Color</th>
                  <th className="py-2 px-2 w-8 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                {dataPoints.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 group">
                    <td className="py-2 px-2.5 text-[11px] font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) => handleRowChange(idx, "label", e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-md border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent focus:bg-white dark:focus:bg-slate-900 font-medium"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        value={row.value}
                        onChange={(e) =>
                          handleRowChange(idx, "value", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 text-xs rounded-md border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent focus:bg-white dark:focus:bg-slate-900 font-mono text-right font-bold"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={row.color || "#2563EB"}
                          onChange={(e) => handleRowChange(idx, "color", e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          title="Custom Bar Color Override"
                        />
                      </div>
                    </td>
                    <td className="py-1 px-2 text-center">
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Data Point"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3 shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveAndApply}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-102"
        >
          <Check className="w-4 h-4" />
          <span>Apply to Chart</span>
        </button>
      </div>
    </div>
  );
}
