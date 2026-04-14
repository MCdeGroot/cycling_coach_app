import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import NavActions from './nav-actions'

export default async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <header
      className="border-b px-4"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="max-w-[720px] mx-auto flex items-center justify-between h-12">
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight"
          style={{ color: 'var(--color-text)' }}
        >
          Performance Nutrition
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            Dashboard
          </Link>
          <Link
            href="/calculator"
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            Calculator
          </Link>
          <Link
            href="/profile"
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            Profile
          </Link>
          <NavActions />
        </nav>
      </div>
    </header>
  )
}
