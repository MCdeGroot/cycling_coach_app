'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ReconnectBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-md text-sm"
      style={{
        backgroundColor: '#FDF8F0',
        border: '1px solid #F0D8B8',
        color: 'var(--color-text)',
      }}
    >
      <span style={{ color: 'var(--color-muted)' }}>
        Couldn't sync workouts.{' '}
        <Link href="/connect" className="font-medium" style={{ color: 'var(--color-accent)' }}>
          Reconnect →
        </Link>
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-4 text-xs"
        style={{ color: 'var(--color-muted)' }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
