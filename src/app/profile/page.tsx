import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('weight_kg, goal, timezone')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen px-4 py-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-[480px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
            Your profile
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Used to calculate your daily carb, protein and fat targets.
          </p>
        </div>

        <ProfileForm
          initialWeight={profile?.weight_kg ?? null}
          initialGoal={(profile?.goal as 'performance' | 'maintain' | 'cut') ?? 'performance'}
        />
      </div>
    </main>
  )
}
