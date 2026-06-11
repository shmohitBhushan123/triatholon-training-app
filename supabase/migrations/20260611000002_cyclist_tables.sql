-- Cyclist tables: profile, preferences, generated plan, and individual workouts.
-- Training zones use the Coggan 7-zone model, expressed as % of FTP.
-- Power values in cycling_workouts are snapshotted from FTP at generation time
-- so a future FTP update does not alter an existing plan.

set lock_timeout = '1s';
set statement_timeout = '5s';

create table if not exists cyclist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ftp_watts bigint not null,           -- e.g. 163
  weight_kg float,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists cycling_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  training_days bigint[] not null,     -- [0,2,5] where 0=Monday, 6=Sunday
  goal_type text not null check (goal_type in ('completion', 'time_goal', 'base_building')),
  target_event text,                   -- e.g. '70.3_bike', 'gran_fondo'
  target_event_date date,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists cycling_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tri_plan_id uuid,                    -- set when created as part of a tri plan; FK added in migration 4
  target_event text not null,
  target_event_date date not null,
  weeks_total bigint not null,
  created_at timestamptz default now()
);

create table if not exists cycling_workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references cycling_plans(id) on delete cascade,
  week_number bigint not null,
  day_of_week bigint not null,          -- 0=Monday, 6=Sunday
  workout_type text not null check (workout_type in ('endurance', 'tempo', 'threshold', 'vo2max', 'rest')),
  description text,
  target_duration_seconds bigint,
  target_power_zone text,              -- e.g. 'zone2', 'threshold'
  target_power_min_watts bigint,       -- snapshotted from FTP% at generation time
  target_power_max_watts bigint,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

begin;
alter table cyclist_profiles enable row level security;
alter table cycling_preferences enable row level security;
alter table cycling_plans enable row level security;
alter table cycling_workouts enable row level security;
commit;
