/**
 * URL parameter parsing and validation for the shareable race plan URL.
 *
 * Locked format: ?duration=4&intensity=moderate&weight=70
 * Full words only — this format is permanent (shared URLs must remain valid).
 */

import type { Intensity } from "./race-fueling";

export interface CalculatorParams {
  duration: number;
  intensity: Intensity;
  weight: number;
}

export type ParseResult =
  | { valid: true; params: CalculatorParams }
  | { valid: false; error: string; paramsPresent: boolean };

const VALID_INTENSITIES: Intensity[] = ["low", "moderate", "high", "max"];
const MIN_DURATION = 0.5;
const MAX_DURATION = 24;
const MIN_WEIGHT = 30;
const MAX_WEIGHT = 200;

export function parseCalculatorParams(
  searchParams: Record<string, string | string[] | undefined>
): ParseResult {
  const raw = {
    duration: searchParams["duration"],
    intensity: searchParams["intensity"],
    weight: searchParams["weight"],
  };

  const paramsPresent = !!(raw.duration || raw.intensity || raw.weight);

  // No params at all — show empty form, not an error
  if (!paramsPresent) {
    return { valid: false, error: "no_params", paramsPresent: false };
  }

  // duration
  const durationRaw = Array.isArray(raw.duration)
    ? raw.duration[0]
    : raw.duration;
  if (!durationRaw) {
    return { valid: false, error: "missing_duration", paramsPresent };
  }
  const duration = parseFloat(durationRaw);
  if (isNaN(duration) || duration < MIN_DURATION || duration > MAX_DURATION) {
    return { valid: false, error: "invalid_duration", paramsPresent };
  }

  // intensity
  const intensityRaw = Array.isArray(raw.intensity)
    ? raw.intensity[0]
    : raw.intensity;
  if (!intensityRaw) {
    return { valid: false, error: "missing_intensity", paramsPresent };
  }
  if (!VALID_INTENSITIES.includes(intensityRaw as Intensity)) {
    return { valid: false, error: "invalid_intensity", paramsPresent };
  }

  // weight
  const weightRaw = Array.isArray(raw.weight) ? raw.weight[0] : raw.weight;
  if (!weightRaw) {
    return { valid: false, error: "missing_weight", paramsPresent };
  }
  const weight = parseFloat(weightRaw);
  if (isNaN(weight) || weight < MIN_WEIGHT || weight > MAX_WEIGHT) {
    return { valid: false, error: "invalid_weight", paramsPresent };
  }

  return {
    valid: true,
    params: { duration, intensity: intensityRaw as Intensity, weight },
  };
}

export function buildShareUrl(params: CalculatorParams): string {
  const sp = new URLSearchParams({
    duration: String(params.duration),
    intensity: params.intensity,
    weight: String(params.weight),
  });
  return `/calculator?${sp.toString()}`;
}
