-- Catch-up migration: updates cycling tables to match the cycling plan engine
-- TypeScript types. Adds fields introduced during implementation that were
-- not present in the original 20260611000002_cyclist_tables migration.
-- squawk-ignore-file ban-drop-column

set lock_timeout = '1s';
set statement_timeout = '5s';

-- cycling_workouts: replace target_duration_seconds with minutes (consistent
-- with run plan engine), add phase label, volume, TSS, cadence, and w/kg.
-- Also update the workout_type check constraint to match the new type union.
-- squawk-ignore ban-drop-column
alter table cycling_workouts
  drop column if exists target_duration_seconds,
  add column if not exists target_duration_minutes bigint,
  add column if not exists phase text not null default 'base'
    check (phase in ('base', 'build1', 'build2', 'race_prep', 'taper', 'maintenance')),
  add column if not exists weekly_volume_minutes bigint not null default 0,
  add column if not exists tss bigint not null default 0,
  add column if not exists cadence_rpm bigint,
  add column if not exists cadence_max_rpm bigint,
  add column if not exists watts_per_kg numeric(5,2);

-- Drop and re-add the workout_type constraint to include the new type values.
alter table cycling_workouts
  drop constraint if exists cycling_workouts_workout_type_check;

alter table cycling_workouts
  add constraint cycling_workouts_workout_type_check
    check (workout_type in ('recovery', 'endurance', 'sweet_spot', 'threshold', 'vo2max', 'long'))
    not valid;

alter table cycling_workouts
  validate constraint cycling_workouts_workout_type_check;

-- cycling_preferences: add long ride day and weekly ride time target.
alter table cycling_preferences
  add column if not exists long_ride_day bigint,
  add column if not exists target_weekly_ride_minutes bigint not null default 180;
