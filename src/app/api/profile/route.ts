import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const weight = parseFloat(body?.weight_kg)
  const goal = body?.goal

  if (isNaN(weight) || weight < 30 || weight > 250) {
    return NextResponse.json({ error: 'Invalid weight' }, { status: 400 })
  }

  if (!['performance', 'maintain', 'cut'].includes(goal)) {
    return NextResponse.json({ error: 'Invalid goal' }, { status: 400 })
  }

  // Auto-detect timezone vanuit browser wordt meegegeven zodra we dat toevoegen
  // Voor nu: gebruik de bestaande timezone of UTC als default
  const { error } = await supabase
    .from('athlete_profiles')
    .upsert({ id: user.id, weight_kg: weight, goal }, { onConflict: 'id' })

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
