// Intervals.icu OAuth2 callback
import { createClient } from '@/lib/supabase/server'
import { exchangeCode, getAthlete } from '@/lib/intervals/client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/connect?error=${error ?? 'no_code'}`
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const redirectUri = `${origin}/api/intervals/callback`
  const tokens = await exchangeCode(code, redirectUri)

  if (!tokens) {
    return NextResponse.redirect(`${origin}/connect?error=token_exchange_failed`)
  }

  // Haal athlete ID op
  const athlete = await getAthlete('athlete_id_placeholder', 'oauth2', tokens.access_token)
  // Intervals.icu geeft athlete_id soms terug in de token response
  const athleteId = tokens.athlete_id ?? athlete?.id

  if (!athleteId) {
    return NextResponse.redirect(`${origin}/connect?error=no_athlete_id`)
  }

  // Sla tokens op in profiel (upsert)
  const { error: dbError } = await supabase
    .from('athlete_profiles')
    .upsert(
      {
        id: user.id,
        intervals_athlete_id: athleteId,
        intervals_access_token: tokens.access_token,
        intervals_refresh_token: tokens.refresh_token,
        intervals_auth_type: 'oauth2',
      },
      { onConflict: 'id' }
    )

  if (dbError) {
    return NextResponse.redirect(`${origin}/connect?error=save_failed`)
  }

  return NextResponse.redirect(`${origin}/dashboard?connected=1`)
}
