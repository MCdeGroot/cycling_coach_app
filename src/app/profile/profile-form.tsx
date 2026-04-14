'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Goal = 'performance' | 'maintain' | 'cut'

const GOALS: { value: Goal; label: string; description: string }[] = [
  { value: 'performance', label: 'Performance', description: 'Maximise training output' },
  { value: 'maintain',    label: 'Maintain',    description: 'Hold current weight' },
  { value: 'cut',         label: 'Cut',         description: 'Reduce body fat' },
]

interface Props {
  initialWeight: number | null
  initialGoal: Goal
}

export default function ProfileForm({ initialWeight, initialGoal }: Props) {
  const router = useRouter()
  const [weight, setWeight] = useState(initialWeight?.toString() ?? '')
  const [goal, setGoal] = useState<Goal>(initialGoal)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    setSaved(false)

    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 250) {
      setError('Enter a valid weight between 30 and 250 kg.')
      setSaving(false)
      return
    }

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: weightNum, goal }),
    })

    if (!res.ok) {
      setError('Could not save profile. Try again.')
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Weight */}
      <div>
        <label
          htmlFor="weight"
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--color-muted)' }}
        >
          Body weight (kg)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="weight"
            type="number"
            inputMode="decimal"
            min="30"
            max="250"
            step="0.1"
            required
            placeholder="70"
            value={weight}
            onChange={(e) => { setWeight(e.target.value); setSaved(false) }}
            className="w-32 px-3 py-2.5 rounded-md border text-sm outline-none tabular-nums"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>kg</span>
        </div>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
          Used to calculate carb targets (g/kg) and protein (1.8g/kg).
        </p>
      </div>

      {/* Goal */}
      <div>
        <p className="block text-sm font-medium mb-3" style={{ color: 'var(--color-muted)' }}>
          Goal
        </p>
        <div
          role="radiogroup"
          aria-label="Training goal"
          className="grid gap-2"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {GOALS.map((g) => {
            const selected = goal === g.value
            return (
              <button
                key={g.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => { setGoal(g.value); setSaved(false) }}
                className="flex flex-col items-start px-3 py-3 rounded-md border text-left transition-colors"
                style={{
                  backgroundColor: selected ? 'var(--color-accent-light)' : 'var(--color-surface)',
                  borderColor: selected ? 'var(--color-accent)' : 'var(--color-border)',
                  color: selected ? 'var(--color-accent)' : 'var(--color-muted)',
                }}
              >
                <span className="text-sm font-medium block" style={{ color: selected ? 'var(--color-accent)' : 'var(--color-text)' }}>
                  {g.label}
                </span>
                <span className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  {g.description}
                </span>
              </button>
            )
          })}
        </div>

        {/* Goal effect uitgelegd */}
        <div className="mt-3 text-xs space-y-0.5" style={{ color: 'var(--color-muted)' }}>
          {goal === 'performance' && <p>Carb targets at full recommended levels. No modifier applied.</p>}
          {goal === 'maintain'    && <p>Carbs reduced by 0.5g/kg. Slight deficit to hold weight.</p>}
          {goal === 'cut'         && <p>Carbs reduced by 1.5g/kg. Meaningful deficit for fat loss.</p>}
        </div>
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: saving ? 'var(--color-muted)' : 'var(--color-accent)',
            color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>

        {saved && (
          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--color-success)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saved
          </span>
        )}

        <Link
          href="/dashboard"
          className="text-sm ml-auto"
          style={{ color: 'var(--color-muted)' }}
        >
          ← Back to dashboard
        </Link>
      </div>
    </form>
  )
}
