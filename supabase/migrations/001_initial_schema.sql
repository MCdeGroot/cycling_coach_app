-- Phase 1 initial schema
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- =============================================
-- 1. ATHLETE PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  weight_kg float,
  goal text CHECK (goal IN ('performance', 'maintain', 'cut')),
  timezone text NOT NULL DEFAULT 'UTC',
  intervals_athlete_id text,
  intervals_access_token text,
  intervals_refresh_token text,
  intervals_api_key text,
  intervals_auth_type text CHECK (intervals_auth_type IN ('oauth2', 'api_key')),
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-create profiel na signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.athlete_profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.athlete_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.athlete_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.athlete_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- =============================================
-- 2. WORKOUTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.athlete_profiles ON DELETE CASCADE,
  date date NOT NULL,
  tss float,
  duration_min int,
  name text,
  source text NOT NULL CHECK (source IN ('intervals', 'manual')),
  is_planned boolean NOT NULL DEFAULT false,
  intervals_event_id text,
  UNIQUE (user_id, intervals_event_id)
);

CREATE INDEX IF NOT EXISTS workouts_user_date ON public.workouts (user_id, date);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workouts"
  ON public.workouts FOR ALL
  USING (user_id = auth.uid());

-- =============================================
-- 3. DAILY TARGETS
-- =============================================
CREATE TABLE IF NOT EXISTS public.daily_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.athlete_profiles ON DELETE CASCADE,
  date date NOT NULL,
  kcal_target int NOT NULL,
  carb_target_g int NOT NULL,
  protein_target_g int NOT NULL,
  fat_target_g int NOT NULL,
  fat_floor_applied boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS daily_targets_user_date ON public.daily_targets (user_id, date);

ALTER TABLE public.daily_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own targets"
  ON public.daily_targets FOR ALL
  USING (user_id = auth.uid());

-- =============================================
-- 4. FOOD ENTRIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.athlete_profiles ON DELETE CASCADE,
  date date NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  product_name text NOT NULL,
  kcal int NOT NULL,
  carb_g float NOT NULL,
  protein_g float NOT NULL DEFAULT 0,
  fat_g float NOT NULL DEFAULT 0,
  quantity_g float,
  source text NOT NULL CHECK (source IN ('open_food_facts', 'manual')),
  workout_id uuid REFERENCES public.workouts ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS food_entries_user_date ON public.food_entries (user_id, date);

ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own food entries"
  ON public.food_entries FOR ALL
  USING (user_id = auth.uid());
