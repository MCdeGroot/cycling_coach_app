// Workout sync endpoint — POST /api/intervals/sync
import { createClient } from '@/lib/supabase/server'
import { syncWorkouts } from '@/lib/intervals/sync'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await syncWorkouts(supabase, user.id)

  if (!result.ok) {
    const status =
      result.error === 'UNAUTHORIZED' ? 401
      : result.error === 'RATE_LIMITED' ? 429
      : 500

    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ synced: result.synced })
}
