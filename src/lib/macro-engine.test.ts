import { describe, it, expect } from 'vitest'
import {
  getTSSBand,
  getDurationBand,
  calculateDailyMacros,
  calculateDailyMacrosFromLoad,
} from './macro-engine'

describe('getTSSBand', () => {
  it('TSS 0 → rest', () => expect(getTSSBand(0)).toBe('rest'))
  it('TSS 1 → easy', () => expect(getTSSBand(1)).toBe('easy'))
  it('TSS 150 → easy', () => expect(getTSSBand(150)).toBe('easy'))
  it('TSS 151 → moderate', () => expect(getTSSBand(151)).toBe('moderate'))
  it('TSS 300 → moderate', () => expect(getTSSBand(300)).toBe('moderate'))
  it('TSS 301 → hard', () => expect(getTSSBand(301)).toBe('hard'))
  it('TSS 450 → hard', () => expect(getTSSBand(450)).toBe('hard'))
  it('TSS 451 → veryHard', () => expect(getTSSBand(451)).toBe('veryHard'))
})

describe('getDurationBand', () => {
  it('0 min → rest', () => expect(getDurationBand(0)).toBe('rest'))
  it('30 min → easy', () => expect(getDurationBand(30)).toBe('easy'))
  it('60 min → moderate', () => expect(getDurationBand(60)).toBe('moderate'))
  it('120 min → moderate', () => expect(getDurationBand(120)).toBe('moderate'))
  it('121 min → hard', () => expect(getDurationBand(121)).toBe('hard'))
  it('240 min → hard', () => expect(getDurationBand(240)).toBe('hard'))
  it('241 min → veryHard', () => expect(getDurationBand(241)).toBe('veryHard'))
})

describe('calculateDailyMacros — rest day 70kg performance', () => {
  const result = calculateDailyMacros(70, 'performance', 'rest')

  it('carbs: 70 * 3 = 210g', () => expect(result.carb_g).toBe(210))
  it('protein: 70 * 1.8 = 126g', () => expect(result.protein_g).toBe(126))
  it('band = rest', () => expect(result.band).toBe('rest'))
  it('total_kcal > 0', () => expect(result.total_kcal).toBeGreaterThan(0))
})

describe('calculateDailyMacros — hard day 70kg performance', () => {
  const result = calculateDailyMacros(70, 'performance', 'hard')

  it('carbs: 70 * 8 = 560g', () => expect(result.carb_g).toBe(560))
  it('protein: 70 * 1.8 = 126g', () => expect(result.protein_g).toBe(126))
  it('band = hard', () => expect(result.band).toBe('hard'))
})

describe('calculateDailyMacros — goal modifiers', () => {
  it('maintain reduces carbs by 0.5g/kg', () => {
    const perf = calculateDailyMacros(70, 'performance', 'moderate')
    const maint = calculateDailyMacros(70, 'maintain', 'moderate')
    expect(maint.carb_g).toBe(perf.carb_g - Math.round(70 * 0.5))
  })

  it('cut reduces carbs by 1.5g/kg', () => {
    const perf = calculateDailyMacros(70, 'performance', 'moderate')
    const cut = calculateDailyMacros(70, 'cut', 'moderate')
    expect(cut.carb_g).toBe(perf.carb_g - Math.round(70 * 1.5))
  })
})

describe('calculateDailyMacros — fat floor', () => {
  it('fat_floor_applied=true wanneer residual vet onder minimum is', () => {
    // Op een rest dag met cut goal kan het vloer worden geraakt
    const result = calculateDailyMacros(70, 'cut', 'rest')
    if (result.fat_floor_applied) {
      expect(result.fat_g).toBeGreaterThanOrEqual(Math.round(70 * 1.0))
    }
  })

  it('fat nooit onder 1g/kg', () => {
    const bands = ['rest', 'easy', 'moderate', 'hard', 'veryHard'] as const
    const goals = ['performance', 'maintain', 'cut'] as const
    for (const band of bands) {
      for (const goal of goals) {
        const r = calculateDailyMacros(70, goal, band)
        expect(r.fat_g).toBeGreaterThanOrEqual(70)
      }
    }
  })
})

describe('calculateDailyMacrosFromLoad', () => {
  it('gebruikt TSS als beschikbaar', () => {
    const r = calculateDailyMacrosFromLoad(70, 'performance', 350, null)
    expect(r.band).toBe('hard')
  })

  it('valt terug op duration als TSS null is', () => {
    const r = calculateDailyMacrosFromLoad(70, 'performance', null, 180)
    expect(r.band).toBe('hard')
  })

  it('rest dag als beide null', () => {
    const r = calculateDailyMacrosFromLoad(70, 'performance', null, null)
    expect(r.band).toBe('rest')
  })
})
