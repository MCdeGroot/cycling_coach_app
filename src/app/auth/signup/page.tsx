'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/connect`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="w-full max-w-sm">
          {/* Check mark */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: 'var(--color-accent-light)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Check your email
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
            We sent a confirmation link to <span className="font-medium" style={{ color: 'var(--color-text)' }}>{email}</span>.
            Click the link to activate your account.
          </p>

          {/* Spam tip */}
          <div
            className="px-4 py-3 rounded-md text-sm mb-6"
            style={{ backgroundColor: 'var(--color-accent-light)', borderLeft: '3px solid var(--color-accent)' }}
          >
            <p className="font-medium mb-0.5" style={{ color: 'var(--color-accent)' }}>
              Not in your inbox?
            </p>
            <p style={{ color: 'var(--color-muted)' }}>
              Check your <strong>spam or junk folder</strong> — confirmation emails sometimes end up there.
            </p>
          </div>

          <p className="text-sm text-center" style={{ color: 'var(--color-muted)' }}>
            Wrong email?{' '}
            <button
              onClick={() => { setSent(false); setEmail(''); setPassword('') }}
              className="font-medium hover:underline"
              style={{ color: 'var(--color-accent)' }}
            >
              Start over
            </button>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Create account
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
          Daily macro targets synced to your Intervals.icu training.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-muted)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-muted)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
              Minimum 8 characters
            </p>
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md text-sm font-medium transition-colors mt-2"
            style={{
              backgroundColor: loading ? 'var(--color-muted)' : 'var(--color-accent)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center" style={{ color: 'var(--color-muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium" style={{ color: 'var(--color-accent)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
