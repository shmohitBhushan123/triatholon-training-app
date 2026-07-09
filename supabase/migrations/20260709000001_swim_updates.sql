-- Catch-up migration: updates swim_workouts to match the swim plan engine
-- TypeScript types. Adds phase and weekly_volume_yards columns introduced
-- during implementation that were not present in the original
-- 20260611000003_swimmer_tables migration.

set lock_timeout = '1s';
set statement_timeout = '5s';

-- swim_workouts: add phase label and weekly yard volume target.
-- Phase is snapshotted from the schedule at generation time so each workout
-- carries its own context (e.g. 'build1') without a join.
alter table swim_workouts
  add column if not exists phase text not null default 'base',
  add column if not exists weekly_volume_yards bigint not null default 0;

-- Add the phase check constraint in two separate transactions:
-- Txn 1 — ADD CONSTRAINT NOT VALID: registers the constraint without scanning
--          existing rows; only needs an ACCESS EXCLUSIVE lock briefly.
-- Txn 2 — VALIDATE CONSTRAINT: scans existing rows but only holds a
--          SHARE UPDATE EXCLUSIVE lock so reads and writes continue.
begin;
alter table swim_workouts
  add constraint swim_workouts_phase_check
    check (phase in ('base', 'build1', 'build2', 'race_prep', 'taper', 'maintenance'))
    not valid;
commit;

begin;
alter table swim_workouts
  validate constraint swim_workouts_phase_check;
commit;
