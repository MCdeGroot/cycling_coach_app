import { getTSSBand, getDurationBand } from '@/lib/macro-engine'
import type { TSSBand } from '@/lib/macro-engine'

export interface ActivityCardWorkout {
  name: string | null
  duration_min: number | null
  tss: number | null
  avg_watts: number | null
  calories_kcal: number | null
  is_planned: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_data: Record<string, any> | null
}

const BAND_STYLE: Record<TSSBand, { border: string; labelBg: string; labelColor: string; label: string }> = {
  rest:     { border: 'var(--color-border)', labelBg: 'var(--color-bg)',           labelColor: 'var(--color-muted)', label: 'Rest'     },
  easy:     { border: '#A78BFA',             labelBg: '#EDE9FE',                   labelColor: '#5B21B6',            label: 'Easy'     },
  moderate: { border: '#34D399',             labelBg: '#D1FAE5',                   labelColor: '#065F46',            label: 'Moderate' },
  hard:     { border: 'var(--color-accent)', labelBg: 'var(--color-accent-light)', labelColor: 'var(--color-accent)',label: 'Hard'     },
  veryHard: { border: '#F87171',             labelBg: '#FEE2E2',                   labelColor: '#991B1B',            label: 'Race'     },
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>{label}</p>
      <p className="text-sm font-medium tabular-nums" style={{ color: 'var(--color-text)' }}>{value}</p>
    </div>
  )
}

// Lees een waarde uit raw_data als fallback op het dedicated column
function fromRaw<T>(raw: Record<string, unknown> | null, key: string): T | null {
  if (!raw) return null
  const v = raw[key]
  return v != null ? (v as T) : null
}

export default function ActivityCard({ workout }: { workout: ActivityCardWorkout }) {
  const raw = workout.raw_data

  const band = workout.tss != null
    ? getTSSBand(workout.tss)
    : workout.duration_min != null
    ? getDurationBand(workout.duration_min)
    : 'rest'

  const style = BAND_STYLE[band]

  // Lees uit raw_data — icu_average_watts is het correcte veld, niet average_watts
  const avgWatts = workout.avg_watts ?? fromRaw<number>(raw, 'icu_average_watts')
  const calories = workout.calories_kcal ?? fromRaw<number>(raw, 'calories')
  const carbsUsed = fromRaw<number>(raw, 'carbs_used')

  return (
    <div
      className="rounded-lg border overflow-hidden mb-6"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        borderLeftWidth: '3px',
        borderLeftColor: style.border,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <p className="text-sm font-medium truncate pr-2" style={{ color: 'var(--color-text)' }}>
          {workout.name ?? 'Workout'}
          {workout.is_planned && (
            <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--color-muted)' }}>planned</span>
          )}
        </p>
        <span
          className="shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded"
          style={{ backgroundColor: style.labelBg, color: style.labelColor }}
        >
          {style.label}
        </span>
      </div>

      {/* Stats grid — 3 col × 2 rows */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-3 px-4 py-3">
        <Stat
          label="Duration"
          value={workout.duration_min ? formatDuration(workout.duration_min) : '—'}
        />
        <Stat
          label="Avg power"
          value={avgWatts != null ? `${Math.round(avgWatts)}W` : '—'}
        />
        <Stat
          label="TSS"
          value={workout.tss != null ? String(Math.round(workout.tss)) : '—'}
        />
        <Stat
          label="Calories"
          value={calories != null ? `${calories} kcal` : '—'}
        />
        <Stat
          label="Carbs used"
          value={carbsUsed != null ? `${Math.round(carbsUsed)}g` : '—'}
        />
      </div>
    </div>
  )
}
