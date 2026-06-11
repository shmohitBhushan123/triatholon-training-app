-- Tri tables: preferences, umbrella plan, and weekly hour allocation.
-- Individual workouts live in run_workouts, cycling_workouts, and swim_workouts,
-- linked via tri_plan_id on each sport's plan table.
-- This migration also adds the FK constraints for tri_plan_id on the sport plan
-- tables created in migrations 1–3 — those columns exist already without a FK.

set lock_timeout = '1s';
set statement_timeout = '5s';

create table if not exists tri_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hours_per_week bigint not null check (hours_per_week between 5 and 20),
  run_days bigint[] not null,          -- subset of week days assigned to running
  bike_days bigint[] not null,         -- subset assigned to cycling
  swim_days bigint[] not null,         -- subset assigned to swimming
  target_race_distance text not null check (target_race_distance in ('sprint', 'olympic', '70.3', 'full')),
  target_race_date date not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists tri_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_race_distance text not null,
  target_race_date date not null,
  weeks_total bigint not null,
  hours_per_week bigint not null,
  created_at timestamptz default now()
);

create table if not exists tri_plan_weeks (
  id uuid primary key default gen_random_uuid(),
  tri_plan_id uuid not null references tri_plans(id) on delete cascade,
  week_number bigint not null,
  total_hours_allocated float not null,
  run_hours float not null,
  bike_hours float not null,
  swim_hours float not null,
  created_at timestamptz default now()
);

-- Add FK constraints to sport plan tables now that tri_plans exists.
-- The tri_plan_id columns were declared without a FK in migrations 1–3.
-- NOT VALID skips the table scan so the lock is brief; VALIDATE CONSTRAINT
-- runs the scan in a separate transaction with a weaker lock.
begin;
alter table run_plans
  add constraint fk_run_plan_tri_plan
  foreign key (tri_plan_id) references tri_plans(id) on delete set null
  not valid;
alter table cycling_plans
  add constraint fk_cycling_plan_tri_plan
  foreign key (tri_plan_id) references tri_plans(id) on delete set null
  not valid;
alter table swim_plans
  add constraint fk_swim_plan_tri_plan
  foreign key (tri_plan_id) references tri_plans(id) on delete set null
  not valid;
commit;

begin;
alter table run_plans validate constraint fk_run_plan_tri_plan;
alter table cycling_plans validate constraint fk_cycling_plan_tri_plan;
alter table swim_plans validate constraint fk_swim_plan_tri_plan;
commit;

begin;
alter table tri_preferences enable row level security;
alter table tri_plans enable row level security;
alter table tri_plan_weeks enable row level security;
commit;
