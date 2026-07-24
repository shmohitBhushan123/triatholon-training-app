-- Catch-up migration: adds long_run_day and long_ride_day to tri_preferences
-- to match the TriPreferences TypeScript type. These are optional overrides —
-- when null, tri/generators.ts defaults to the last (highest-numbered) day in
-- run_days/bike_days respectively.

set lock_timeout = '1s';
set statement_timeout = '5s';

alter table tri_preferences
  add column if not exists long_run_day bigint,
  add column if not exists long_ride_day bigint;
