import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function todayLocal() {
  return new Date().toISOString().split('T')[0]
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const durationMin = parseInt(body?.duration_min)
  const tss = body?.tss ?? null

  if (!durationMin || durationMin < 1) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
  }

  const today = todayLocal()

  // Verwijder eventuele bestaande handmatige entry voor vandaag
  await supabase
    .from('workouts')
    .delete()
    .eq('user_id', user.id)
    .eq('date', today)
    .eq('source', 'manual')

  const { error } = await supabase.from('workouts').insert({
    user_id: user.id,
    date: today,
    tss,
    duration_min: durationMin,
    name: 'Today\'s workout',
    source: 'manual',
    is_planned: false,
    intervals_event_id: null,
  })

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
