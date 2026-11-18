import React from "react";
import type { ProcessStepSchema } from "@/lib/schemas/deck-schema";
import { z } from "zod";

type ProcessStep = z.infer<typeof ProcessStepSchema>;

interface ProcessStepsBlockProps {
  title?: string;
  steps: ProcessStep[];
  accentColor?: string;
  inkColor?: string;
  surfaceBorder?: string;
}

export function ProcessStepsBlock({
  title,
  steps,
  accentColor = "#2563EB",
  inkColor = "#0F172A",
  surfaceBorder = "#E2E8F0",
}: ProcessStepsBlockProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      {title && (
        <h4 className="text-sm font-bold uppercase tracking-wider opacity-80" style={{ color: inkColor }}>
          {title}
        </h4>
      )}
      <div className="grid grid-cols-1 gap-2.5">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3.5 rounded-xl transition-all border"
            style={{ borderColor: surfaceBorder }}
          >
            <span
              className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white flex-shrink-0 shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {step.step}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight" style={{ color: inkColor }}>
                {step.title}
              </span>
              <span className="text-xs mt-1 leading-relaxed opacity-75" style={{ color: inkColor }}>
                {step.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
