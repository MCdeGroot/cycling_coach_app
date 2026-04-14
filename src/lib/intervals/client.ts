// Intervals.icu API client

export interface IntervalsEvent {
  id: string
  start_date_local: string   // ISO date string "2026-04-14T09:00:00"
  icu_training_load: number | null  // TSS equivalent
  moving_time: number | null        // seconds
  name: string | null
  category: string | null  // "WORKOUT" | "RACE" | etc.
  indoor: boolean | null
}

export interface IntervalsActivity {
  id: number
  start_date_local: string
  icu_training_load: number | null  // werkelijke TSS
  moving_time: number | null        // seconden
  name: string | null
  type: string | null               // "Ride" | "Run" | "VirtualRide" etc.
  average_watts: number | null      // gem. vermogen
  calories: number | null           // verbrande calorieën
  kilojoules: number | null         // mechanische arbeid (fallback voor calories)
}

export interface IntervalsAthlete {
  id: string
  name: string
}

const BASE = 'https://intervals.icu/api/v1'

// Shared fetch helper — geeft null terug bij netwerk errors, gooit bij auth errors
async function intervalsFetch<T>(
  path: string,
  options: {
    athleteId: string
    authType: 'oauth2' | 'api_key'
    token: string
  }
): Promise<T | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.authType === 'api_key') {
    // Intervals.icu API key auth: Basic auth met "API_KEY" als username
    const encoded = btoa(`API_KEY:${options.token}`)
    headers['Authorization'] = `Basic ${encoded}`
  } else {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const res = await fetch(`${BASE}${path}`, { headers })

  if (res.status === 401 || res.status === 403) {
    throw new Error('UNAUTHORIZED')
  }

  if (!res.ok) {
    return null
  }

  return res.json() as Promise<T>
}

// Haal athlete info op
export async function getAthlete(
  athleteId: string,
  authType: 'oauth2' | 'api_key',
  token: string
): Promise<IntervalsAthlete | null> {
  return intervalsFetch<IntervalsAthlete>(`/athlete/${athleteId}`, {
    athleteId,
    authType,
    token,
  })
}

// Haal voltooide activiteiten op
export async function getActivities(
  athleteId: string,
  authType: 'oauth2' | 'api_key',
  token: string,
  oldest: string,
  newest: string
): Promise<IntervalsActivity[] | null> {
  return intervalsFetch<IntervalsActivity[]>(
    `/athlete/${athleteId}/activities?oldest=${oldest}&newest=${newest}`,
    { athleteId, authType, token }
  )
}

// Haal events op — 30 dagen terug + 14 dagen vooruit
export async function getEvents(
  athleteId: string,
  authType: 'oauth2' | 'api_key',
  token: string,
  oldest: string,  // ISO date "2026-03-15"
  newest: string   // ISO date "2026-04-28"
): Promise<IntervalsEvent[] | null> {
  return intervalsFetch<IntervalsEvent[]>(
    `/athlete/${athleteId}/events?oldest=${oldest}&newest=${newest}`,
    { athleteId, authType, token }
  )
}

// Refresh OAuth2 access token
export async function refreshOAuthToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
} | null> {
  const res = await fetch('https://intervals.icu/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.INTERVALS_CLIENT_ID!,
      client_secret: process.env.INTERVALS_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) return null
  return res.json()
}

// Exchange authorization code voor tokens
export async function exchangeCode(code: string, redirectUri: string): Promise<{
  access_token: string
  refresh_token: string
  athlete_id?: string
} | null> {
  const res = await fetch('https://intervals.icu/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.INTERVALS_CLIENT_ID!,
      client_secret: process.env.INTERVALS_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) return null
  return res.json()
}
