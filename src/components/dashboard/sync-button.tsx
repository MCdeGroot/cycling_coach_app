'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SyncButton() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSync() {
    setState('syncing')
    setMessage('')

    const res = await fetch('/api/intervals/sync', { method: 'POST' })

    if (res.status === 429) {
      setState('error')
      setMessage('Sync recently ran — try again in a few minutes.')
      return
    }

    if (!res.ok) {
      setState('error')
      setMessage('Sync failed. Check your Intervals.icu connection.')
      return
    }

    const data = await res.json()
    setState('done')
    setMessage(`Synced ${data.synced} workout${data.synced !== 1 ? 's' : ''}.`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={state === 'syncing'}
        className="text-sm px-4 py-2 rounded-md border transition-colors"
        style={{
          borderColor: 'var(--color-border)',
          color: state === 'syncing' ? 'var(--color-muted)' : 'var(--color-text)',
          backgroundColor: 'var(--color-surface)',
          cursor: state === 'syncing' ? 'not-allowed' : 'pointer',
        }}
      >
        {state === 'syncing' ? 'Syncing...' : 'Sync workouts'}
      </button>

      {message && (
        <span
          className="text-xs"
          style={{ color: state === 'error' ? 'var(--color-error)' : 'var(--color-muted)' }}
        >
          {message}
        </span>
      )}
    </div>
  )
}
