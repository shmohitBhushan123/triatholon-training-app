-- Catch-up migration: adds columns introduced during run plan engine implementation
-- that were not present in the original 20260611000001_runner_tables migration.
--
-- run_workouts: phase label, weekly volume, and miles equivalent of target distance.
-- run_preferences: weekly run time target collected during onboarding.

set lock_timeout = '1s';
set statement_timeout = '5s';

alter table run_workouts
  add column if not exists phase text not null default 'base'
    check (phase in ('base', 'build1', 'build2', 'race_prep', 'taper', 'maintenance')),
  add column if not exists weekly_volume_minutes bigint not null default 0,
  add column if not exists target_distance_miles numeric(6,2);

alter table run_preferences
  add column if not exists target_weekly_run_minutes bigint not null default 180;
