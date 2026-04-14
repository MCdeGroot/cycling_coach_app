// Daily Macro Engine v1
// Spec: design doc §"Daily Macro Engine (v1)" — Burke et al. carb targets

export type TSSBand = 'rest' | 'easy' | 'moderate' | 'hard' | 'veryHard'
export type Goal = 'performance' | 'maintain' | 'cut'

export interface MacroResult {
  carb_g: number
  protein_g: number
  fat_g: number
  fat_floor_applied: boolean
  total_kcal: number
  band: TSSBand
}

// TSS → band
export function getTSSBand(tss: number): TSSBand {
  if (tss === 0) return 'rest'
  if (tss <= 150) return 'easy'
  if (tss <= 300) return 'moderate'
  if (tss <= 450) return 'hard'
  return 'veryHard'
}

// Duration (min) → band fallback als TSS niet beschikbaar
export function getDurationBand(durationMin: number): TSSBand {
  if (durationMin === 0) return 'rest'
  if (durationMin < 60) return 'easy'
  if (durationMin <= 120) return 'moderate'
  if (durationMin <= 240) return 'hard'
  return 'veryHard'
}

const CARB_TARGET_GKG: Record<TSSBand, number> = {
  rest: 3,
  easy: 4,
  moderate: 6,
  hard: 8,
  veryHard: 10,
}

const GOAL_CARB_MODIFIER: Record<Goal, number> = {
  performance: 0,
  maintain: -0.5,
  cut: -1.5,
}

const KCAL_PER_KG: Record<TSSBand, number> = {
  rest: 30,
  easy: 35,
  moderate: 40,
  hard: 47,
  veryHard: 55,
}

const GOAL_KCAL_MODIFIER: Record<Goal, number> = {
  performance: 0,
  maintain: -100,
  cut: -400,
}

export function calculateDailyMacros(
  weightKg: number,
  goal: Goal,
  band: TSSBand
): MacroResult {
  const carbGkg = CARB_TARGET_GKG[band] + GOAL_CARB_MODIFIER[goal]
  const carb_g = Math.round(weightKg * carbGkg)
  const protein_g = Math.round(weightKg * 1.8)

  const tdee_kcal = weightKg * KCAL_PER_KG[band] + GOAL_KCAL_MODIFIER[goal]

  const carb_kcal = carb_g * 4
  const protein_kcal = protein_g * 4
  const fat_residual_kcal = tdee_kcal - carb_kcal - protein_kcal
  const fat_floor_kcal = weightKg * 1.0 * 9

  const fat_floor_applied = fat_residual_kcal < fat_floor_kcal
  const fat_kcal = Math.max(fat_residual_kcal, fat_floor_kcal)
  const fat_g = Math.round(fat_kcal / 9)
  const total_kcal = Math.round(carb_kcal + protein_kcal + fat_kcal)

  return { carb_g, protein_g, fat_g, fat_floor_applied, total_kcal, band }
}

// Convenience: bereken op basis van TSS (primair) of duration (fallback)
export function calculateDailyMacrosFromLoad(
  weightKg: number,
  goal: Goal,
  tss: number | null,
  durationMin: number | null
): MacroResult {
  const band =
    tss !== null ? getTSSBand(tss) : getDurationBand(durationMin ?? 0)
  return calculateDailyMacros(weightKg, goal, band)
}
