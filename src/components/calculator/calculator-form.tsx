"use client";

import { useState } from "react";
import { IntensitySelector } from "./intensity-selector";
import { BrevetCard } from "./brevet-card";
import { calculateRaceFueling, type Intensity } from "@/lib/race-fueling";
import type { CalculatorParams } from "@/lib/url-params";
import { buildShareUrl } from "@/lib/url-params";
import { useRouter } from "next/navigation";

interface Props {
  initialParams?: CalculatorParams;
}

export function CalculatorForm({ initialParams }: Props) {
  const router = useRouter();

  const [duration, setDuration] = useState<string>(
    initialParams ? String(initialParams.duration) : ""
  );
  const [weight, setWeight] = useState<string>(
    initialParams ? String(initialParams.weight) : ""
  );
  const [intensity, setIntensity] = useState<Intensity>(
    initialParams?.intensity ?? "moderate"
  );

  const [result, setResult] = useState(() => {
    if (initialParams) {
      return calculateRaceFueling(
        initialParams.duration,
        initialParams.intensity,
        initialParams.weight,
        null
      );
    }
    return null;
  });

  const [params, setParams] = useState<CalculatorParams | null>(
    initialParams ?? null
  );

  const [errors, setErrors] = useState<{
    duration?: string;
    weight?: string;
  }>({});

  function validate(): CalculatorParams | null {
    const errs: { duration?: string; weight?: string } = {};

    const d = parseFloat(duration);
    if (!duration || isNaN(d) || d < 0.5 || d > 24) {
      errs.duration = "Enter a duration between 0.5 and 24 hours";
    }

    const w = parseFloat(weight);
    if (!weight || isNaN(w) || w < 30 || w > 200) {
      errs.weight = "Enter a weight between 30 and 200 kg";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return null;

    return { duration: d, intensity, weight: w };
  }

  function handleCalculate() {
    const p = validate();
    if (!p) return;

    const r = calculateRaceFueling(p.duration, p.intensity, p.weight, null);
    setResult(r);
    setParams(p);

    // Update URL without full navigation so the page is shareable
    const url = buildShareUrl(p);
    router.replace(url, { scroll: false });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleCalculate();
  }

  return (
    <div>
      {/* Form */}
      <div className="space-y-5">
        {/* Duration + Weight row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div className="space-y-1.5">
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-foreground"
            >
              Duration (hours)
            </label>
            <input
              id="duration"
              type="number"
              inputMode="decimal"
              min={0.5}
              max={24}
              step={0.5}
              placeholder="e.g. 4"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onKeyDown={handleKeyDown}
              className={[
                "w-full rounded-md border px-3 py-2 text-sm bg-background text-foreground",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "tabular-nums",
                errors.duration ? "border-destructive" : "border-border",
              ].join(" ")}
              aria-describedby={errors.duration ? "duration-error" : undefined}
            />
            {errors.duration && (
              <p id="duration-error" className="text-xs text-destructive mt-1">
                {errors.duration}
              </p>
            )}
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <label
              htmlFor="weight"
              className="block text-sm font-medium text-foreground"
            >
              Body weight (kg)
            </label>
            <input
              id="weight"
              type="number"
              inputMode="decimal"
              min={30}
              max={200}
              step={1}
              placeholder="e.g. 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={handleKeyDown}
              className={[
                "w-full rounded-md border px-3 py-2 text-sm bg-background text-foreground",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "tabular-nums",
                errors.weight ? "border-destructive" : "border-border",
              ].join(" ")}
              aria-describedby={errors.weight ? "weight-error" : undefined}
            />
            {errors.weight && (
              <p id="weight-error" className="text-xs text-destructive mt-1">
                {errors.weight}
              </p>
            )}
          </div>
        </div>

        {/* Intensity */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Race intensity
          </label>
          <IntensitySelector value={intensity} onChange={setIntensity} />
        </div>

        {/* Calculate */}
        <button
          type="button"
          onClick={handleCalculate}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Generate fuel plan
        </button>
      </div>

      {/* Result */}
      {result && params && <BrevetCard result={result} params={params} />}
    </div>
  );
}
