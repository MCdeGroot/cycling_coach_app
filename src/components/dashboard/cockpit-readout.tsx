import ActivityCard from './activity-card'
import type { ActivityCardWorkout } from './activity-card'

interface Props {
  carbG: number
  bandLabel: string
  workout: ActivityCardWorkout | null
  loggedCarbG: number
  loggedProteinG: number
  loggedFatG: number
  totalKcal: number
  loggedKcal: number
  proteinG: number
  fatG: number
  fatFloorApplied: boolean
}

// Carbs → amber (accent), Protein → green (success), Fat → indigo
const MACRO_COLOR = {
  carb:    { bar: 'var(--color-accent)',  text: 'var(--color-accent)'  },
  protein: { bar: '#1B7A3E',             text: '#1B7A3E'               },
  fat:     { bar: '#4F46E5',             text: '#4F46E5'               },
}

function carbProgressColor(pct: number) {
  if (pct > 1.1) return 'var(--color-error)'
  if (pct > 0.8) return 'var(--color-warning)'
  return MACRO_COLOR.carb.bar
}

function MacroBar({
  label,
  loggedG,
  targetG,
  color,
}: {
  label: string
  loggedG: number
  targetG: number
  color: string
}) {
  const pct = targetG > 0 ? loggedG / targetG : 0
  const pctCapped = Math.min(pct, 1)

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--color-muted)' }}>{label}</span>
        <span className="tabular-nums" style={{ color }}>
          {loggedG}g <span style={{ color: 'var(--color-muted)' }}>/ {targetG}g</span>
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={loggedG}
        aria-valuemin={0}
        aria-valuemax={targetG}
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.round(pctCapped * 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function CockpitReadout({
  carbG,
  bandLabel,
  workout,
  loggedCarbG,
  loggedProteinG,
  loggedFatG,
  totalKcal,
  loggedKcal,
  proteinG,
  fatG,
  fatFloorApplied,
}: Props) {
  return (
    <section aria-label="Today's targets">
      {/* Carb number — cockpit readout */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span
            className="tabular-nums leading-none"
            style={{
              fontSize: '68px',
              fontWeight: 600,
              color: 'var(--color-accent)',
              letterSpacing: '-2px',
            }}
          >
            {carbG}
          </span>
          <span className="text-xl font-medium" style={{ color: 'var(--color-muted)' }}>
            g carbs
          </span>
        </div>

        {/* Band chip */}
        <span
          className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded"
          style={{
            backgroundColor: 'var(--color-accent-light)',
            color: 'var(--color-accent)',
          }}
        >
          {bandLabel}
        </span>
      </div>

      {/* Activity card */}
      {workout ? (
        <ActivityCard workout={workout} />
      ) : (
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          No workout planned today — rest day targets shown.
        </p>
      )}

      {/* Macro breakdown */}
      <div
        className="rounded-lg border p-4 space-y-3"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Today's macros
        </h2>

        <MacroBar
          label="Carbs"
          loggedG={loggedCarbG}
          targetG={carbG}
          color={carbProgressColor(carbG > 0 ? loggedCarbG / carbG : 0)}
        />
        <MacroBar
          label="Protein"
          loggedG={loggedProteinG}
          targetG={proteinG}
          color={MACRO_COLOR.protein.bar}
        />
        <MacroBar
          label="Fat"
          loggedG={loggedFatG}
          targetG={fatG}
          color={MACRO_COLOR.fat.bar}
        />

        {fatFloorApplied && (
          <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>
            Fat minimum applied (1g/kg protected)
          </p>
        )}

        {/* Total kcal */}
        <div
          className="flex justify-between text-sm font-medium pt-2 border-t tabular-nums"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <span>Total</span>
          <span>{loggedKcal} / {totalKcal} kcal</span>
        </div>

        {/* Log food CTA */}
        <a
          href="/log"
          className="block w-full text-center py-2 rounded-md text-sm font-medium mt-2 transition-colors"
          style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
        >
          + Log food
        </a>
      </div>
    </section>
  )
}
