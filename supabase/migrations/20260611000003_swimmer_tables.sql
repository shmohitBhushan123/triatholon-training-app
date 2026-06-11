-- Swimmer tables: profile, preferences, generated plan, and individual workouts.
-- CSS (Critical Swim Speed) is derived from two time trials:
--   css_seconds_per_100yd = (tt400_seconds - tt200_seconds) / 2
-- Pace values in swim_workouts are snapshotted from CSS at generation time
-- so a future re-test does not alter an existing plan.

set lock_timeout = '1s';
set statement_timeout = '5s';

create table if not exists swimmer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  css_per_100yd_seconds float not null, -- e.g. 115.0 for 1:55/100yd
  tt400_seconds bigint not null,       -- 400yd time trial in seconds
  tt200_seconds bigint not null,       -- 200yd time trial in seconds
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists swim_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  training_days bigint[] not null,     -- [1,3,5] where 0=Monday, 6=Sunday
  goal_type text not null check (goal_type in ('completion', 'time_goal', 'base_building')),
  target_event text,                   -- e.g. '70.3_swim', 'open_water_1mile'
  target_event_date date,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists swim_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tri_plan_id uuid,                    -- set when created as part of a tri plan; FK added in migration 4
  target_event text not null,
  target_event_date date not null,
  weeks_total bigint not null,
  created_at timestamptz default now()
);

create table if not exists swim_workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references swim_plans(id) on delete cascade,
  week_number bigint not null,
  day_of_week bigint not null,          -- 0=Monday, 6=Sunday
  workout_type text not null check (workout_type in ('aerobic', 'threshold', 'speed', 'rest')),
  description text,
  target_distance_meters bigint,
  target_css_zone text,                -- e.g. 'aerobic', 'threshold'
  target_pace_min text,                -- snapshotted from CSS at generation time, e.g. '1:55'
  target_pace_max text,                -- e.g. '2:05'
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

begin;
alter table swimmer_profiles enable row level security;
alter table swim_preferences enable row level security;
alter table swim_plans enable row level security;
alter table swim_workouts enable row level security;
commit;
