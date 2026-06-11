-- Runner tables: profile, preferences, generated plan, and individual workouts.
-- The VDOT lookup table (Jack Daniels pace zones) is a TypeScript constant —
-- it never changes and requires no DB round-trip at plan generation time.
-- Pace values in run_workouts are snapshotted from that constant at generation
-- time so a future profile update does not alter an existing plan.

set lock_timeout = '1s';
set statement_timeout = '5s';

create table if not exists runner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vdot bigint not null,               -- e.g. 46, derived from seed time
  seed_distance text not null,         -- e.g. 'half_marathon', '5k', '10k'
  seed_time_seconds bigint not null,   -- e.g. 5865 for 1:37:45
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists run_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  training_days bigint[] not null,     -- [0,1,3,4,5] where 0=Monday, 6=Sunday
  long_run_day bigint not null,           -- must be a value within training_days
  goal_type text not null check (goal_type in ('completion', 'time_goal', 'base_building')),
  target_race_distance text,           -- e.g. 'half_marathon', '70.3_run'
  target_race_date date,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists run_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tri_plan_id uuid,                    -- set when created as part of a tri plan; FK added in migration 4
  target_race_distance text not null,
  target_race_date date not null,
  weeks_total bigint not null,
  created_at timestamptz default now()
);

create table if not exists run_workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references run_plans(id) on delete cascade,
  week_number bigint not null,
  day_of_week bigint not null,          -- 0=Monday, 6=Sunday
  workout_type text not null check (workout_type in ('easy', 'tempo', 'interval', 'long', 'rest')),
  description text,
  target_distance_meters bigint,
  target_pace_zone text,               -- e.g. 'easy', 'tempo', 'interval'
  target_pace_min text,                -- snapshotted from VDOT constant at generation time, e.g. '8:16'
  target_pace_max text,                -- e.g. '9:00'
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

begin;
alter table runner_profiles enable row level security;
alter table run_preferences enable row level security;
alter table run_plans enable row level security;
alter table run_workouts enable row level security;
commit;
