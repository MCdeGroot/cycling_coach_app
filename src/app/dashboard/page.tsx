import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateDailyMacrosFromLoad } from '@/lib/macro-engine'
import type { Goal, TSSBand } from '@/lib/macro-engine'
import CockpitReadout from '@/components/dashboard/cockpit-readout'
import SevenDayView from '@/components/dashboard/seven-day-view'
import ReconnectBanner from '@/components/dashboard/reconnect-banner'
import SyncButton from '@/components/dashboard/sync-button'
import ManualWorkout from '@/components/dashboard/manual-workout'
import Link from 'next/link'

interface AthleteProfile {
  weight_kg: number | null
  goal: string | null
  intervals_athlete_id: string | null
  intervals_auth_type: string | null
  last_sync_at: string | null
}

interface Workout {
  id: string
  date: string
  tss: number | null
  duration_min: number | null
  name: string | null
  is_planned: boolean
  avg_watts: number | null
  calories_kcal: number | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_data: Record<string, any> | null
}

interface DailyTarget {
  date: string
  kcal_target: number
  carb_target_g: number
  protein_target_g: number
  fat_target_g: number
  fat_floor_applied: boolean
}

function todayLocal() {
  return new Date().toISOString().split('T')[0]
}

function getNext7Days(): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

const BAND_LABELS: Record<TSSBand, string> = {
  rest: 'Rest day',
  easy: 'Easy / recovery',
  moderate: 'Moderate training',
  hard: 'Hard training',
  veryHard: 'Very hard / race day',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; sync?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const params = await searchParams
  const justConnected = params.connected === '1'

  // Haal profiel op
  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('weight_kg, goal, intervals_athlete_id, intervals_auth_type, last_sync_at')
    .eq('id', user.id)
    .single<AthleteProfile>()

  const today = todayLocal()
  const next7 = getNext7Days()

  // Haal workouts op: 7 dagen vooruit + vandaag (inclusief voltooide activiteiten)
  // Gesorteerd: completed (is_planned=false) vóór planned — zodat we de echte activiteit prefereren
  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, date, tss, duration_min, name, is_planned, avg_watts, calories_kcal, raw_data')
    .eq('user_id', user.id)
    .in('date', next7)
    .order('is_planned', { ascending: true }) // false (completed) eerst
    .returns<Workout[]>()

  // Haal today's food log totaal op
  const { data: foodEntries } = await supabase
    .from('food_entries')
    .select('carb_g, protein_g, fat_g, kcal')
    .eq('user_id', user.id)
    .eq('date', today)

  const loggedCarbs = foodEntries?.reduce((sum, e) => sum + (e.carb_g ?? 0), 0) ?? 0
  const loggedProtein = foodEntries?.reduce((sum, e) => sum + (e.protein_g ?? 0), 0) ?? 0
  const loggedFat = foodEntries?.reduce((sum, e) => sum + (e.fat_g ?? 0), 0) ?? 0
  const loggedKcal = foodEntries?.reduce((sum, e) => sum + (e.kcal ?? 0), 0) ?? 0

  // Bereken macro targets als profiel compleet is
  const hasProfile = profile?.weight_kg && profile?.goal

  // Prefereer voltooide activiteit met echte TSS — Strava stubs hebben null TSS
  const todayWorkouts = workouts?.filter((w) => w.date === today) ?? []
  const todayWorkout =
    todayWorkouts.find((w) => !w.is_planned && w.tss != null) ??
    todayWorkouts.find((w) => !w.is_planned) ??
    todayWorkouts[0] ??
    null

  let todayMacros = null
  if (hasProfile) {
    todayMacros = calculateDailyMacrosFromLoad(
      profile!.weight_kg!,
      profile!.goal as Goal,
      todayWorkout?.tss ?? null,
      todayWorkout?.duration_min ?? null
    )
  }

  // Bereken 7-day macros
  const weekData = next7.map((date) => {
    const dayWorkouts = workouts?.filter((w) => w.date === date) ?? []
    const workout =
      dayWorkouts.find((w) => !w.is_planned && w.tss != null) ??
      dayWorkouts.find((w) => !w.is_planned) ??
      dayWorkouts[0] ??
      null
    const macros = hasProfile
      ? calculateDailyMacrosFromLoad(
          profile!.weight_kg!,
          profile!.goal as Goal,
          workout?.tss ?? null,
          workout?.duration_min ?? null
        )
      : null
    return { date, workout, macros }
  })

  const showReconnectBanner =
    profile?.intervals_athlete_id && !profile?.last_sync_at

  return (
    <main className="min-h-screen px-4 py-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-[720px] mx-auto space-y-8">
        {/* Reconnect banner */}
        {showReconnectBanner && <ReconnectBanner />}

        {/* Just connected banner */}
        {justConnected && (
          <div
            className="px-4 py-3 rounded-md text-sm font-medium"
            style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
          >
            Intervals.icu connected! Syncing your workouts...
          </div>
        )}

        {/* Profiel onvolledig */}
        {!hasProfile && (
          <div
            className="px-4 py-4 rounded-md border"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Set your weight and goal to see today's targets.
            </p>
            <Link
              href="/profile"
              className="text-sm font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Complete profile →
            </Link>
          </div>
        )}

        {/* Cockpit readout — carb target */}
        {todayMacros && (
          <CockpitReadout
            carbG={todayMacros.carb_g}
            bandLabel={BAND_LABELS[todayMacros.band]}
            workout={todayWorkout}
            loggedCarbG={loggedCarbs}
            loggedProteinG={loggedProtein}
            loggedFatG={loggedFat}
            totalKcal={todayMacros.total_kcal}
            loggedKcal={loggedKcal}
            proteinG={todayMacros.protein_g}
            fatG={todayMacros.fat_g}
            fatFloorApplied={todayMacros.fat_floor_applied}
          />
        )}

        {/* Geen Intervals verbinding */}
        {!profile?.intervals_athlete_id && (
          <div
            className="px-4 py-4 rounded-md border"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Connect Intervals.icu to sync your planned workouts.
            </p>
            <Link
              href="/connect"
              className="text-sm font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Connect →
            </Link>
          </div>
        )}

        {/* Sync + manual entry */}
        <div className="flex flex-col gap-3">
          {profile?.intervals_athlete_id && <SyncButton />}
          {hasProfile && <ManualWorkout />}
        </div>

        {/* 7-day view */}
        {hasProfile && <SevenDayView weekData={weekData} today={today} />}
      </div>
    </main>
  )
}
