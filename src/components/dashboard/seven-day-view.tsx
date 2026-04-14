import type { TSSBand, MacroResult } from '@/lib/macro-engine'

interface Workout {
  name: string | null
  duration_min: number | null
  tss: number | null
  is_planned: boolean
}

interface DayData {
  date: string
  workout: Workout | null
  macros: MacroResult | null
}

interface Props {
  weekData: DayData[]
  today: string
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const BAND_CHIP: Record<TSSBand, { label: string; bg: string; color: string }> = {
  rest:      { label: 'Rest',     bg: 'var(--color-bg)',           color: 'var(--color-muted)' },
  easy:      { label: 'Easy',     bg: '#EDE9FE',                   color: '#5B21B6' },
  moderate:  { label: 'Moderate', bg: '#D1FAE5',                   color: '#065F46' },
  hard:      { label: 'Hard',     bg: 'var(--color-accent-light)', color: 'var(--color-accent)' },
  veryHard:  { label: 'Race',     bg: '#FEE2E2',                   color: '#991B1B' },
}

export default function SevenDayView({ weekData, today }: Props) {
  return (
    <section aria-label="7-day block">
      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
        Next 7 days
      </h2>

      <div
        className="rounded-lg border overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {weekData.map((day, i) => {
          const isToday = day.date === today
          const d = new Date(day.date + 'T12:00:00')
          const dayName = DAY_NAMES[d.getDay()]
          const dateNum = d.getDate()
          const chip = day.macros ? BAND_CHIP[day.macros.band] : BAND_CHIP.rest

          return (
            <div
              key={day.date}
              className="flex items-center gap-3 px-4"
              style={{
                height: '48px',
                borderBottom: i < weekData.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              {/* Day name + date */}
              <div
                className="w-14 shrink-0 text-sm font-medium tabular-nums"
                style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-muted)' }}
              >
                {dayName} {dateNum}
              </div>

              {/* Workout name */}
              <div className="flex-1 text-sm truncate" style={{ color: 'var(--color-text)' }}>
                {day.workout?.name ?? <span style={{ color: 'var(--color-muted)' }}>Rest</span>}
              </div>

              {/* Carb target */}
              <div
                className="w-16 text-right text-sm tabular-nums shrink-0"
                style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-text)' }}
              >
                {day.macros ? `${day.macros.carb_g}g` : '—'}
              </div>

              {/* Band chip */}
              <div
                className="w-20 text-right shrink-0"
              >
                <span
                  className="inline-block px-2 py-0.5 text-xs font-medium rounded"
                  style={{ backgroundColor: chip.bg, color: chip.color }}
                >
                  {chip.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
