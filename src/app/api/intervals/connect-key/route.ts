// API key connect endpoint — POST /api/intervals/connect-key
import { createClient } from '@/lib/supabase/server'
import { getAthlete } from '@/lib/intervals/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.api_key || !body?.athlete_id) {
    return NextResponse.json({ error: 'api_key and athlete_id required' }, { status: 400 })
  }

  // Verifieer de API key door athlete op te halen
  const athlete = await getAthlete(body.athlete_id, 'api_key', body.api_key)
  if (!athlete) {
    return NextResponse.json(
      { error: 'Invalid API key or Athlete ID. Check your Intervals.icu settings.' },
      { status: 401 }
    )
  }

  // Sla op
  const { error: dbError } = await supabase
    .from('athlete_profiles')
    .upsert(
      {
        id: user.id,
        intervals_athlete_id: body.athlete_id,
        intervals_api_key: body.api_key,
        intervals_auth_type: 'api_key',
        // Wis eventuele OAuth tokens
        intervals_access_token: null,
        intervals_refresh_token: null,
      },
      { onConflict: 'id' }
    )

  if (dbError) {
    return NextResponse.json({ error: 'Failed to save credentials.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
