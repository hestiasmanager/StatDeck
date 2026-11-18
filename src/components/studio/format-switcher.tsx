"use client";

import React from "react";
import type { OutputFormat } from "@/lib/schemas/deck-schema";
import { ScrollText, Layers, Monitor } from "lucide-react";

interface FormatSwitcherProps {
  currentFormat: OutputFormat;
  onChangeFormat: (format: OutputFormat) => void;
}

export function FormatSwitcher({ currentFormat, onChangeFormat }: FormatSwitcherProps) {
  const formats: Array<{
    id: OutputFormat;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "carousel",
      label: "LinkedIn Carousel",
      sublabel: "4:5",
      icon: <Layers className="w-4 h-4 flex-shrink-0" />,
    },
    {
      id: "infographic",
      label: "Infographic",
      sublabel: "Poster",
      icon: <ScrollText className="w-4 h-4 flex-shrink-0" />,
    },
    {
      id: "presentation",
      label: "Presentation",
      sublabel: "16:9",
      icon: <Monitor className="w-4 h-4 flex-shrink-0" />,
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-800">
      {formats.map((fmt) => {
        const isActive = currentFormat === fmt.id;
        return (
          <button
            key={fmt.id}
            onClick={() => onChangeFormat(fmt.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
              isActive
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            {fmt.icon}
            <span className="hidden sm:inline font-medium leading-none">{fmt.label}</span>
            <span className="inline sm:hidden font-medium leading-none">{fmt.sublabel}</span>
          </button>
        );
      })}
    </div>
  );
}
