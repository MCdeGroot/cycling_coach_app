-- Store the full Intervals.icu API response so no fields are ever lost
alter table public.workouts
  add column if not exists raw_data jsonb;

-- avg_watts and calories_kcal are now derived from raw_data on read;
-- keep the columns for now so existing rows aren't broken, but new syncs
-- will populate raw_data instead of relying on these dedicated columns.
