import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConnectClient from './connect-client'

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Check of er al een Intervals.icu verbinding is
  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('intervals_athlete_id, intervals_auth_type')
    .eq('id', user.id)
    .single()

  const params = await searchParams
  const isNew = params.new === '1'
  const hasError = params.error

  return (
    <ConnectClient
      isNew={isNew}
      hasError={!!hasError}
      errorMessage={hasError}
      alreadyConnected={!!profile?.intervals_athlete_id}
    />
  )
}
