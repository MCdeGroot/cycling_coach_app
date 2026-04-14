// Workout sync — planned events + completed activities
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getEvents,
  getActivities,
  refreshOAuthToken,
  type IntervalsEvent,
  type IntervalsActivity,
} from './client'

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
    intervals_event_id: String(event.id),
  }
}

function activityToWorkout(activity: IntervalsActivity & Record<string, unknown>, userId: string) {
  const dateStr = activity.start_date_local.split('T')[0]
  const durationMin = activity.moving_time ? Math.round(activity.moving_time / 60) : null
  const raw = activity as Record<string, unknown>
  // Calories: gebruik directe waarde of schat van kilojoules
  const caloriesKcal = (raw.calories as number | null)
    ?? (raw.kilojoules ? Math.round(raw.kilojoules as number) : null)
  return {
    user_id: userId,
    date: dateStr,
    tss: activity.icu_training_load ?? null,
    duration_min: durationMin,
    name: activity.name ?? activity.type ?? 'Workout',
    source: 'intervals' as const,
    is_planned: false,
    intervals_event_id: `activity_${activity.id}`,
    avg_watts: (raw.icu_average_watts as number | null) ?? null,
    calories_kcal: caloriesKcal,
    raw_data: raw,  // sla volledige API response op — nooit meer dataverlies
  }
}

async function fetchWithTokenRefresh<T>(
  supabase: SupabaseClient,
  userId: string,
  profile: {
    intervals_athlete_id: string
    intervals_auth_type: string
    intervals_refresh_token: string | null
  },
  token: string,
  fetcher: (token: string) => Promise<T | null>
): Promise<{ data: T | null; token: string; error?: 'UNAUTHORIZED' | 'API_ERROR' }> {
  try {
    const data = await fetcher(token)
    return { data, token }
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      if (profile.intervals_auth_type === 'oauth2' && profile.intervals_refresh_token) {
        const refreshed = await refreshOAuthToken(profile.intervals_refresh_token)
        if (!refreshed) return { data: null, token, error: 'UNAUTHORIZED' }
        await supabase
          .from('athlete_profiles')
          .update({
            intervals_access_token: refreshed.access_token,
            intervals_refresh_token: refreshed.refresh_token,
          })
          .eq('id', userId)
        try {
          const data = await fetcher(refreshed.access_token)
          return { data, token: refreshed.access_token }
        } catch {
          return { data: null, token, error: 'UNAUTHORIZED' }
        }
      }
      return { data: null, token, error: 'UNAUTHORIZED' }
    }
    return { data: null, token, error: 'API_ERROR' }
  }
}

export type SyncResult =
  | { ok: true; synced: number; events: number; activities: number }
  | { ok: false; error: 'UNAUTHORIZED' | 'RATE_LIMITED' | 'API_ERROR' }

export async function syncWorkouts(
  supabase: SupabaseClient,
  userId: string
): Promise<SyncResult> {
  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select(
      'intervals_athlete_id, intervals_auth_type, intervals_access_token, intervals_refresh_token, intervals_api_key, last_sync_at'
    )
    .eq('id', userId)
    .single()

  if (!profile?.intervals_athlete_id) return { ok: false, error: 'API_ERROR' }

  // Rate limit: 30s in dev, 5 min in prod
  const rateLimitMs = process.env.NODE_ENV === 'development' ? 30_000 : 5 * 60 * 1000
  if (profile.last_sync_at) {
    const diffMs = Date.now() - new Date(profile.last_sync_at).getTime()
    if (diffMs < rateLimitMs) return { ok: false, error: 'RATE_LIMITED' }
  }

  const authType = profile.intervals_auth_type as 'oauth2' | 'api_key'
  let token = authType === 'api_key' ? profile.intervals_api_key : profile.intervals_access_token
  if (!token) return { ok: false, error: 'UNAUTHORIZED' }

  const oldest = dateOffset(-30)
  const newest = dateOffset(14)
  const athleteId = profile.intervals_athlete_id

  // Fetch events (planned) en activities (completed) tegelijk
  const [eventsResult, activitiesResult] = await Promise.all([
    fetchWithTokenRefresh(supabase, userId, profile, token, (t) =>
      getEvents(athleteId, authType, t, oldest, newest)
    ),
    fetchWithTokenRefresh(supabase, userId, profile, token, (t) =>
      getActivities(athleteId, authType, t, oldest, newest)
    ),
  ])

  if (eventsResult.error === 'UNAUTHORIZED' && activitiesResult.error === 'UNAUTHORIZED') {
    return { ok: false, error: 'UNAUTHORIZED' }
  }

  const rows: ReturnType<typeof eventToWorkout>[] = []

  // Voeg geplande events toe
  const events = eventsResult.data ?? []
  const workoutEvents = events.filter(
    (e) => e.category === 'WORKOUT' || e.icu_training_load != null || e.moving_time != null
  )
  rows.push(...workoutEvents.map((e) => eventToWorkout(e, userId)))

  // Voeg voltooide activiteiten toe — prefixed ID voorkomt conflict met events
  const activities = activitiesResult.data ?? []
  rows.push(...activities.map((a) => activityToWorkout(a as IntervalsActivity & Record<string, unknown>, userId)))

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from('workouts')
      .upsert(rows, { onConflict: 'user_id,intervals_event_id' })
    if (upsertError) return { ok: false, error: 'API_ERROR' }
  }

  await supabase
    .from('athlete_profiles')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', userId)

  return {
    ok: true,
    synced: rows.length,
    events: workoutEvents.length,
    activities: activities.length,
  }
}
