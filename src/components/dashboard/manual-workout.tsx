'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Intensity = 'low' | 'moderate' | 'high' | 'max'

const INTENSITIES: { value: Intensity; label: string; description: string }[] = [
  { value: 'low',      label: 'Low',      description: '< 65% FTP' },
  { value: 'moderate', label: 'Moderate', description: '65–80% FTP' },
  { value: 'high',     label: 'High',     description: '80–95% FTP' },
  { value: 'max',      label: 'Max',      description: '> 95% FTP' },
]

// Schat TSS op basis van duur + intensiteit
function estimateTSS(durationMin: number, intensity: Intensity): number {
  const IF: Record<Intensity, number> = { low: 0.65, moderate: 0.75, high: 0.88, max: 1.0 }
  const hours = durationMin / 60
  return Math.round(hours * IF[intensity] * IF[intensity] * 100)
}

export default function ManualWorkout() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const durationMin = (parseInt(hours || '0') * 60) + parseInt(minutes || '0')
  const estimatedTSS = durationMin > 0 ? estimateTSS(durationMin, intensity) : null

  async function handleSave() {
    if (!durationMin || durationMin < 1) {
      setError('Enter a duration.')
      return
    }
    setError(null)
    setSaving(true)

    const res = await fetch('/api/workouts/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_min: durationMin,
        intensity,
        tss: estimatedTSS,
      }),
    })

    if (!res.ok) {
      setError('Could not save. Try again.')
      setSaving(false)
      return
    }

    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm hover:underline"
        style={{ color: 'var(--color-muted)' }}
      >
        + Log today's workout manually
      </button>
    )
  }

  return (
    <div
      className="rounded-lg border p-4 space-y-4"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Today's workout
        </h3>
        <button
          onClick={() => setOpen(false)}
          className="text-sm"
          style={{ color: 'var(--color-muted)' }}
        >
          Cancel
        </button>
      </div>

      {/* Duration */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>Duration</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="24"
            placeholder="1"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-16 px-2 py-1.5 rounded-md border text-sm text-center tabular-nums outline-none"
            style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>h</span>
          <input
            type="number"
            min="0"
            max="59"
            placeholder="10"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-16 px-2 py-1.5 rounded-md border text-sm text-center tabular-nums outline-none"
            style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>min</span>
        </div>
      </div>

      {/* Intensity */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>Intensity</p>
        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Intensity">
          {INTENSITIES.map((opt) => {
            const selected = intensity === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setIntensity(opt.value)}
                className="flex flex-col items-center px-2 py-2 rounded-md border text-center transition-colors"
                style={{
                  backgroundColor: selected ? 'var(--color-accent-light)' : 'var(--color-bg)',
                  borderColor: selected ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                <span className="text-xs font-medium" style={{ color: selected ? 'var(--color-accent)' : 'var(--color-text)' }}>
                  {opt.label}
                </span>
                <span className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  {opt.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* TSS preview */}
      {estimatedTSS !== null && (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Estimated training load: <span className="font-medium tabular-nums" style={{ color: 'var(--color-text)' }}>{estimatedTSS} TSS</span>
        </p>
      )}

      {error && <p className="text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 rounded-md text-sm font-medium transition-colors"
        style={{
          backgroundColor: saving ? 'var(--color-muted)' : 'var(--color-accent)',
          color: '#fff',
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Saving...' : 'Save workout'}
      </button>
    </div>
  )
}
