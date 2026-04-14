"use client";

import type { Intensity } from "@/lib/race-fueling";

const OPTIONS: { value: Intensity; label: string; description: string }[] = [
  { value: "low", label: "Low", description: "Easy spin, 45g/hr" },
  { value: "moderate", label: "Moderate", description: "Steady effort, 60g/hr" },
  { value: "high", label: "High", description: "Hard race, 75g/hr" },
  { value: "max", label: "Max", description: "TT effort, 90g/hr" },
];

interface Props {
  value: Intensity;
  onChange: (v: Intensity) => void;
}

export function IntensitySelector({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Race intensity"
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={[
              "flex flex-col items-start px-3 py-2.5 rounded-md border text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary bg-accent text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40",
            ].join(" ")}
          >
            <span className="text-sm font-semibold leading-tight">
              {opt.label}
            </span>
            <span className="text-xs mt-0.5 opacity-70">{opt.description}</span>
          </button>
        );
      })}
    </div>
  );
}
