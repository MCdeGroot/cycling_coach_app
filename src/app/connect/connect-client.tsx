'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  isNew: boolean
  hasError: boolean
  errorMessage: string | undefined
  alreadyConnected: boolean
}

export default function ConnectClient({ isNew, hasError, errorMessage, alreadyConnected }: Props) {
  const router = useRouter()
  const [apiKeyMode, setApiKeyMode] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [athleteId, setAthleteId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleOAuth() {
    const clientId = process.env.NEXT_PUBLIC_INTERVALS_CLIENT_ID
    const redirectUri = encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/intervals/callback`
    )
    const scope = encodeURIComponent('read:athlete read:events read:activities')
    window.location.href = `https://intervals.icu/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`
  }

  async function handleApiKeySave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaving(true)

    const res = await fetch('/api/intervals/connect-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, athlete_id: athleteId }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setSaveError(body.error ?? 'Could not save API key.')
      setSaving(false)
      return
    }

    router.push('/dashboard?connected=1')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        {isNew && (
          <p className="text-xs font-medium mb-6 px-3 py-2 rounded-md" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
            Account created. Now connect your Intervals.icu to unlock daily macro targets.
          </p>
        )}

        {hasError && (
          <p className="text-xs font-medium mb-6 px-3 py-2 rounded-md" style={{ backgroundColor: '#FEF2F2', color: 'var(--color-error)' }}>
            {errorMessage === 'access_denied'
              ? 'Authorization was cancelled. Try again below.'
              : 'Connection failed. Please try again.'}
          </p>
        )}

        {alreadyConnected && (
          <p className="text-xs font-medium mb-6 px-3 py-2 rounded-md" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
            Intervals.icu is already connected. Reconnecting will replace the existing token.
          </p>
        )}

        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Connect Intervals.icu
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
          We sync your planned workouts to calculate your daily carb, protein, and fat targets. Read-only access — we never write to your account.
        </p>

        {!apiKeyMode ? (
          <div className="space-y-4">
            <button
              onClick={handleOAuth}
              className="w-full py-2.5 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
            >
              Connect with Intervals.icu
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
              <button
                onClick={() => setApiKeyMode(true)}
                className="hover:underline"
                style={{ color: 'var(--color-muted)' }}
              >
                Using an API key instead?
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleApiKeySave} className="space-y-4">
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Generate a read-only API key in{' '}
              <span className="font-medium">Intervals.icu → Settings → Developer Settings</span>.
              Copy your Athlete ID from the same page.
            </p>

            <div>
              <label htmlFor="athlete-id" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
                Athlete ID
              </label>
              <input
                id="athlete-id"
                type="text"
                required
                placeholder="e.g. i12345"
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>

            <div>
              <label htmlFor="api-key" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
                API Key
              </label>
              <input
                id="api-key"
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>

            {saveError && (
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>{saveError}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: saving ? 'var(--color-muted)' : 'var(--color-accent)', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving...' : 'Save API key'}
            </button>

            <button
              type="button"
              onClick={() => setApiKeyMode(false)}
              className="w-full text-sm text-center hover:underline"
              style={{ color: 'var(--color-muted)' }}
            >
              Back to OAuth
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--color-muted)' }}>
            Skip for now
          </Link>
        </div>
      </div>
    </main>
  )
}
