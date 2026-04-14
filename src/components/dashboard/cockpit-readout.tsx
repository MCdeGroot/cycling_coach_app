interface Workout {
  name: string | null
  duration_min: number | null
  tss: number | null
  is_planned: boolean
}

interface Props {
  carbG: number
  bandLabel: string
  workout: Workout | null
  loggedCarbG: number
  totalKcal: number
  loggedKcal: number
  proteinG: number
  fatG: number
  fatFloorApplied: boolean
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function progressColor(pct: number) {
  if (pct > 1.1) return 'var(--color-error)'
  if (pct > 0.8) return 'var(--color-warning)'
  return 'var(--color-accent)'
}

export default function CockpitReadout({
  carbG,
  bandLabel,
  workout,
  loggedCarbG,
  totalKcal,
  loggedKcal,
  proteinG,
  fatG,
  fatFloorApplied,
}: Props) {
  const carbPct = carbG > 0 ? loggedCarbG / carbG : 0
  const carbPctCapped = Math.min(carbPct, 1)

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

      {/* Today's workout */}
      {workout ? (
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          {workout.name ?? 'Workout'}
          {workout.duration_min ? ` · ${formatDuration(workout.duration_min)}` : ''}
          {workout.tss ? ` · TSS ${Math.round(workout.tss)}` : ''}
          {workout.is_planned ? ' · planned' : ''}
        </p>
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

        {/* Carb progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
            <span>Carbs</span>
            <span className="tabular-nums">
              {loggedCarbG}g / {carbG}g
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={loggedCarbG}
            aria-valuemin={0}
            aria-valuemax={carbG}
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(carbPctCapped * 100)}%`,
                backgroundColor: progressColor(carbPct),
              }}
            />
          </div>
        </div>

        {/* Protein */}
        <div className="flex justify-between text-sm tabular-nums" style={{ color: 'var(--color-muted)' }}>
          <span>Protein</span>
          <span>{proteinG}g</span>
        </div>

        {/* Fat */}
        <div className="flex justify-between text-sm tabular-nums" style={{ color: 'var(--color-muted)' }}>
          <span>Fat</span>
          <span>{fatG}g</span>
        </div>

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
