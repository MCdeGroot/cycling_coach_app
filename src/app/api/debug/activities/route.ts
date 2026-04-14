// DEBUG ONLY — verwijder voor productie
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BASE = 'https://intervals.icu/api/v1'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('intervals_athlete_id, intervals_auth_type, intervals_api_key, intervals_access_token')
    .eq('id', user.id)
    .single()

  if (!profile?.intervals_athlete_id) {
    return NextResponse.json({ error: 'No Intervals connection' }, { status: 400 })
  }

  const token = profile.intervals_auth_type === 'api_key'
    ? profile.intervals_api_key
    : profile.intervals_access_token

  const encoded = btoa(`API_KEY:${token}`)
  const today = new Date().toISOString().split('T')[0]
  const oldest = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Haal activiteiten op — toon source + key fields om te zien welke bruikbaar zijn
  const res = await fetch(
    `${BASE}/athlete/${profile.intervals_athlete_id}/activities?oldest=${oldest}&newest=${today}`,
    { headers: { Authorization: `Basic ${encoded}` } }
  )

  const raw = await res.json()
  const activities = Array.isArray(raw) ? raw : []

  // Groepeer per source zodat we meteen zien wat beschikbaar is
  const bySource: Record<string, number> = {}
  for (const a of activities) {
    const src = (a.source as string) ?? 'unknown'
    bySource[src] = (bySource[src] ?? 0) + 1
  }

  // Toon de eerste non-Strava activiteit volledig, of anders de eerste Strava stub
  const nonStrava = activities.find((a: Record<string, unknown>) => a.source !== 'STRAVA')
  const firstUsable = nonStrava ?? activities[0]

  return NextResponse.json({
    status: res.status,
    total: activities.length,
    by_source: bySource,
    // Volledige eerste niet-Strava activiteit — alle velden zichtbaar
    first_non_strava: nonStrava ?? null,
  })
}
