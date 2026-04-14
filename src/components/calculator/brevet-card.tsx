"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";
import type { RaceFuelResult } from "@/lib/race-fueling";
import { formatMinutes } from "@/lib/race-fueling";
import { buildShareUrl } from "@/lib/url-params";
import type { CalculatorParams } from "@/lib/url-params";
import { FormulaTooltip } from "./formula-tooltip";

interface Props {
  result: RaceFuelResult;
  params: CalculatorParams;
}

const INTENSITY_LABEL: Record<string, string> = {
  low: "Low intensity",
  moderate: "Moderate intensity",
  high: "High intensity",
  max: "Max / TT effort",
};

export function BrevetCard({ result, params }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.origin + buildShareUrl(params);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalGels = result.gelSchedule.length;

  return (
    <div className="mt-6 space-y-0">
      {/* Brevet card */}
      <div
        className="rounded-[10px] border border-border overflow-hidden"
        style={{ background: "var(--brevet-bg)" }}
      >
        {/* Header */}
        <div className="flex items-baseline justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-semibold text-foreground">
            Race Fuel Plan
          </span>
          <span className="text-xs text-muted-foreground">
            {params.duration}h · {INTENSITY_LABEL[params.intensity]} ·{" "}
            {params.weight}kg
          </span>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 bg-card border-b border-border divide-x divide-border">
          <Stat
            label="Carbs / hr"
            value={`${result.carbPerHr}g`}
            tooltip="Carbohydrate oxidation target per Burke et al. (2011). Low=45g, Moderate=60g, High=75g, Max=90g."
          />
          <Stat
            label="Fluid / hr"
            value={`${result.fluidMlPerHr}ml`}
            tooltip="Baseline 500ml/hr. Override with your sweat rate if known. One standard bidon (750ml) = 1.5 hrs of fluid."
          />
          <Stat
            label="Gels / hr"
            value={String(result.gelsPerHr)}
            tooltip={`${result.gelsPerHr} gel(s)/hr = ${result.gelCarbsPerHr}g carbs. Capped at 2 gels/hr for GI tolerance (1 gel every 30 min minimum).`}
          />
          <Stat
            label="Drink carbs"
            value={
              result.drinkCarbsPerHr > 0
                ? `${result.drinkCarbsPerHr}g/hr`
                : "—"
            }
            tooltip={
              result.drinkCarbsPerHr > 0
                ? `${result.drinkCarbsPerHr}g/hr from carb drink (e.g. maltodextrin mix). Gels alone can't cover the full target at this intensity.`
                : "Gels cover the full carb target at this intensity."
            }
          />
        </div>

        {/* Multi-source note */}
        {result.multiSourceRequired && (
          <div className="px-5 py-2.5 text-xs text-muted-foreground border-b border-border bg-card/50">
            <span className="font-medium text-foreground">Multi-source carbs required</span>{" "}
            — use maltodextrin + fructose (2:1 ratio) to hit {result.carbPerHr}g/hr.
            Single-source carbs absorb at max ~60g/hr.
          </div>
        )}

        {/* Timetable */}
        <table className="w-full border-collapse" aria-label="Race fueling schedule">
          <tbody>
            {result.gelSchedule.map((event, i) => {
              const isLast = i === result.gelSchedule.length - 1;
              // Insert solid food row at the right position
              const showSolidFood =
                result.solidFoodAtMin !== null &&
                i + 1 < result.gelSchedule.length &&
                result.gelSchedule[i + 1].minuteFromStart >
                  result.solidFoodAtMin &&
                event.minuteFromStart <= result.solidFoodAtMin;

              const isLastAndSolidAfter =
                result.solidFoodAtMin !== null &&
                isLast &&
                event.minuteFromStart <= result.solidFoodAtMin;

              return (
                <React.Fragment key={event.minuteFromStart}>
                  <TimetableRow
                    time={formatMinutes(event.minuteFromStart)}
                    action={event.label}
                    sub={
                      i === 0 && result.drinkCarbsPerHr > 0
                        ? "start carb drink"
                        : i > 0 && result.fluidMlPerHr > 0 && i % 2 === 0
                        ? "check fluids"
                        : undefined
                    }
                  />
                  {(showSolidFood || isLastAndSolidAfter) && result.solidFoodAtMin !== null && (
                    <SolidFoodRow
                      time={formatMinutes(result.solidFoodAtMin)}
                    />
                  )}
                </React.Fragment>
              );
            })}
            {/* If no gels yet but solid food applies (edge case: very low carb) */}
            {result.gelSchedule.length === 0 &&
              result.solidFoodAtMin !== null && (
                <SolidFoodRow time={formatMinutes(result.solidFoodAtMin)} />
              )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {totalGels} gels total · Formula: Burke et al.
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary rounded-md px-3 py-1.5 hover:bg-primary hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                Share plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conversion CTA */}
      <ConversionCTA />
    </div>
  );
}

function Stat({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip: string;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-0.5">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <FormulaTooltip content={tooltip} />
      </div>
      <div className="text-[15px] font-semibold tabular-nums text-foreground mt-0.5">
        {value}
      </div>
    </div>
  );
}

function TimetableRow({
  time,
  action,
  sub,
}: {
  time: string;
  action: string;
  sub?: string;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="pl-5 pr-3 py-2.5 align-top w-14">
        <span
          className="text-[13px] font-medium text-primary tabular-nums"
          style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
        >
          {time}
        </span>
      </td>
      <td className="pr-5 py-2.5 align-top">
        <span className="text-[14px] font-medium text-foreground">
          {action}
        </span>
        {sub && (
          <span className="text-[13px] text-muted-foreground ml-2">{sub}</span>
        )}
      </td>
    </tr>
  );
}

function SolidFoodRow({ time }: { time: string }) {
  return (
    <tr className="border-b border-border last:border-0 bg-card/30">
      <td className="pl-5 pr-3 py-2.5 align-top w-14">
        <span
          className="text-[13px] font-medium text-primary tabular-nums"
          style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
        >
          {time}
        </span>
      </td>
      <td className="pr-5 py-2.5 align-top">
        <span
          className="text-[14px] font-medium"
          style={{ color: "var(--success)" }}
        >
          ■ Solid food OK
        </span>
        <span className="text-[13px] text-muted-foreground ml-2">
          banana, rice cake, bar
        </span>
      </td>
    </tr>
  );
}

function ConversionCTA() {
  return (
    <div
      className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3.5"
      style={{ background: "var(--primary-light)" }}
    >
      <p className="text-sm text-foreground">
        Want daily macro targets synced to your Intervals.icu training?
      </p>
      <a
        href="/signup"
        className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Sign up free →
      </a>
    </div>
  );
}
