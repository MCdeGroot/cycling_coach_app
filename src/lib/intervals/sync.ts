// Workout sync logica — 14 dagen vooruit + 30 dagen terug
import type { SupabaseClient } from '@supabase/supabase-js'
import { getEvents, refreshOAuthToken, type IntervalsEvent } from './client'

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function eventToWorkout(event: IntervalsEvent, userId: string) {
  const dateStr = event.start_date_local.split('T')[0]
  const durationMin = event.moving_time ? Math.round(event.moving_time / 60) : null
  const isPlanned = new Date(event.start_date_local) > new Date()

  return {
    user_id: userId,
    date: dateStr,
    tss: event.icu_training_load ?? null,
    duration_min: durationMin,
    name: event.name ?? null,
    source: 'intervals' as const,
    is_planned: isPlanned,
    intervals_event_id: event.id,
  }
}

export type SyncResult =
  | { ok: true; synced: number }
  | { ok: false; error: 'UNAUTHORIZED' | 'RATE_LIMITED' | 'API_ERROR' }

export async function syncWorkouts(
  supabase: SupabaseClient,
  userId: string
): Promise<SyncResult> {
  // Haal profiel op
  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select(
      'intervals_athlete_id, intervals_auth_type, intervals_access_token, intervals_refresh_token, intervals_api_key, last_sync_at'
    )
    .eq('id', userId)
    .single()

  if (!profile?.intervals_athlete_id) {
    return { ok: false, error: 'API_ERROR' }
  }

  // Rate limit: max 1x per 5 minuten
  if (profile.last_sync_at) {
    const lastSync = new Date(profile.last_sync_at)
    const diffMs = Date.now() - lastSync.getTime()
    if (diffMs < 5 * 60 * 1000) {
      return { ok: false, error: 'RATE_LIMITED' }
    }
  }

  const authType = profile.intervals_auth_type as 'oauth2' | 'api_key'
  let token =
    authType === 'api_key'
      ? profile.intervals_api_key
      : profile.intervals_access_token

  if (!token) return { ok: false, error: 'UNAUTHORIZED' }

  const oldest = dateOffset(-30)
  const newest = dateOffset(14)

  let events: IntervalsEvent[] | null = null

  try {
    events = await getEvents(
      profile.intervals_athlete_id,
      authType,
      token,
      oldest,
      newest
    )
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      // Probeer token te refreshen (alleen OAuth2)
      if (authType === 'oauth2' && profile.intervals_refresh_token) {
        const refreshed = await refreshOAuthToken(profile.intervals_refresh_token)
        if (!refreshed) return { ok: false, error: 'UNAUTHORIZED' }

        // Sla nieuwe tokens op
        await supabase
          .from('athlete_profiles')
          .update({
            intervals_access_token: refreshed.access_token,
            intervals_refresh_token: refreshed.refresh_token,
          })
          .eq('id', userId)

        token = refreshed.access_token

        // Retry
        try {
          events = await getEvents(
            profile.intervals_athlete_id,
            authType,
            token,
            oldest,
            newest
          )
        } catch {
          return { ok: false, error: 'UNAUTHORIZED' }
        }
      } else {
        return { ok: false, error: 'UNAUTHORIZED' }
      }
    } else {
      return { ok: false, error: 'API_ERROR' }
    }
  }

  if (!events) return { ok: false, error: 'API_ERROR' }

  // Filter: alleen WORKOUT events met naam of TSS
  const workoutEvents = events.filter(
    (e) =>
      e.category === 'WORKOUT' ||
      e.icu_training_load != null ||
      e.moving_time != null
  )

  const rows = workoutEvents.map((e) => eventToWorkout(e, userId))

  if (rows.length > 0) {
    // Upsert op (user_id, intervals_event_id) — geen duplicaten
    const { error: upsertError } = await supabase
      .from('workouts')
      .upsert(rows, { onConflict: 'user_id,intervals_event_id' })

    if (upsertError) return { ok: false, error: 'API_ERROR' }
  }

  // Update last_sync_at
  await supabase
    .from('athlete_profiles')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', userId)

  return { ok: true, synced: rows.length }
}
