-- Add power and calorie fields to workouts
-- These are populated from Intervals.icu activity data on sync
alter table public.workouts
  add column if not exists avg_watts integer,
  add column if not exists calories_kcal integer;
