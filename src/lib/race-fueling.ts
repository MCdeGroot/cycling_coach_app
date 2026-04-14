/**
 * Race Fueling Engine
 *
 * Pure TypeScript — no side effects, fully unit testable.
 * All algorithms from design doc section "Race Fueling Calculator".
 *
 * Acceptance test:
 *   calculateRaceFueling(4, 'moderate', 70, null)
 *   → 60g/hr carbs, 2 gels/hr (50g), 10g drink/hr, 500ml/hr, solid food OK after 3h
 */

export type Intensity = "low" | "moderate" | "high" | "max";

export interface GelEvent {
  /** Minutes from race start */
  minuteFromStart: number;
  label: string;
}

export interface RaceFuelResult {
  /** Target carbohydrate intake per hour (g) */
  carbPerHr: number;
  /** Number of gels per hour (capped at 2) */
  gelsPerHr: number;
  /** Carbohydrates from gel per hour (g) */
  gelCarbsPerHr: number;
  /** Carbohydrates from drink per hour (g) */
  drinkCarbsPerHr: number;
  /** Fluid target per hour (ml) */
  fluidMlPerHr: number;
  /** Whether solid food is recommended (duration > 3h AND intensity < high) */
  solidFoodOk: boolean;
  /** Minute from race start when solid food becomes OK (null if not recommended) */
  solidFoodAtMin: number | null;
  /** Whether multi-source carbs (maltodextrin + fructose) are required */
  multiSourceRequired: boolean;
  /** Scheduled gel events for the full race */
  gelSchedule: GelEvent[];
}

const GEL_CARBS = 25; // grams per gel unit
const MAX_GELS_PER_HR = 2;
const SOLID_FOOD_DURATION_THRESHOLD_HR = 3; // strictly greater than

const CARB_TARGET: Record<Intensity, number> = {
  low: 45,
  moderate: 60,
  high: 75,
  max: 90,
};

export function calculateRaceFueling(
  durationHr: number,
  intensity: Intensity,
  weightKg: number,
  sweatRateMlHr: number | null
): RaceFuelResult {
  if (durationHr <= 0) throw new Error("Duration must be greater than 0");
  if (weightKg <= 0) throw new Error("Weight must be greater than 0");

  const carbPerHr = CARB_TARGET[intensity];
  const gelsPerHr = Math.min(
    Math.floor(carbPerHr / GEL_CARBS),
    MAX_GELS_PER_HR
  );
  const gelCarbsPerHr = gelsPerHr * GEL_CARBS;
  const drinkCarbsPerHr = Math.max(0, carbPerHr - gelCarbsPerHr);

  const fluidMlPerHr =
    sweatRateMlHr !== null && sweatRateMlHr > 0 ? sweatRateMlHr : 500;

  const solidFoodOk =
    durationHr > SOLID_FOOD_DURATION_THRESHOLD_HR &&
    (intensity === "low" || intensity === "moderate");
  const solidFoodAtMin = solidFoodOk
    ? SOLID_FOOD_DURATION_THRESHOLD_HR * 60
    : null;

  const multiSourceRequired = intensity === "high" || intensity === "max";

  const gelSchedule = buildGelSchedule(durationHr, gelsPerHr);

  return {
    carbPerHr,
    gelsPerHr,
    gelCarbsPerHr,
    drinkCarbsPerHr,
    fluidMlPerHr,
    solidFoodOk,
    solidFoodAtMin,
    multiSourceRequired,
    gelSchedule,
  };
}

/**
 * Build the full gel timing schedule for the race.
 * First gel at 20 minutes; subsequent gels every (60 / gelsPerHr) minutes.
 * If gelsPerHr === 0, returns empty array.
 */
function buildGelSchedule(
  durationHr: number,
  gelsPerHr: number
): GelEvent[] {
  if (gelsPerHr === 0) return [];

  const raceDurationMin = durationHr * 60;
  const intervalMin = 60 / gelsPerHr;
  const schedule: GelEvent[] = [];
  let gelNumber = 1;
  let currentMin = 20; // first gel always at 20 min

  while (currentMin < raceDurationMin) {
    schedule.push({
      minuteFromStart: currentMin,
      label: `Gel ${gelNumber}`,
    });
    gelNumber++;
    // After first gel, advance by the interval
    currentMin = 20 + (gelNumber - 1) * intervalMin;
  }

  return schedule;
}

/** Format minutes as h:mm (e.g. 80 → "1:20") */
export function formatMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
