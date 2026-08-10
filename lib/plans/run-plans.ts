import { createServerClient } from '@/lib/supabase/server';
import type { RunnerProfile, RunPreferences, RunWorkout } from '@/services/plan-engine';
import type { SeedDistance } from '@/services/plan-engine/run/vdot';

export type Db = ReturnType<typeof createServerClient>;

// lib/plans/run-plans.ts
// Persistence layer for run plans — every raw Supabase call for the `run`
// sport lives here so app/api/plans/run/route.ts can read as pure
// orchestration (validate -> derive -> persist -> generate -> persist ->
// respond) instead of mixing HTTP concerns with insert payload shapes.
//
// Each function throws on a DB error rather than returning a Result-style
// object — callers (route handlers) already wrap their orchestration in a
// try/catch and turn any thrown error into a 500, so this keeps error
// handling in one place instead of duplicating `if (error) throw error`
// checks at both layers.

export interface InsertRunnerProfileInput {
  vdot: number;
  seedDistance: SeedDistance;
  seedTimeSeconds: number;
}

export async function insertRunnerProfile(
  db: Db,
  userId: string,
  input: InsertRunnerProfileInput
): Promise<RunnerProfile> {
  const { data, error } = await db
    .from('runner_profiles')
    .insert({
      user_id: userId,
      vdot: input.vdot,
      seed_distance: input.seedDistance,
      seed_time_seconds: input.seedTimeSeconds,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    userId,
    vdot: input.vdot,
    seedDistance: input.seedDistance,
    seedTimeSeconds: input.seedTimeSeconds,
    updatedAt: data.updated_at,
  };
}

export interface InsertRunPreferencesInput {
  trainingDays: number[];
  longRunDay: number;
  goalType: RunPreferences['goalType'];
  targetRaceDistance: string | null;
  targetRaceDate: string | null;
  targetWeeklyRunMinutes: number;
}

export async function insertRunPreferences(
  db: Db,
  userId: string,
  input: InsertRunPreferencesInput
): Promise<RunPreferences> {
  const { data, error } = await db
    .from('run_preferences')
    .insert({
      user_id: userId,
      training_days: input.trainingDays,
      long_run_day: input.longRunDay,
      goal_type: input.goalType,
      target_race_distance: input.targetRaceDistance,
      target_race_date: input.targetRaceDate,
      target_weekly_run_minutes: input.targetWeeklyRunMinutes,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    userId,
    trainingDays: input.trainingDays,
    longRunDay: input.longRunDay,
    goalType: input.goalType,
    targetRaceDistance: input.targetRaceDistance,
    targetRaceDate: input.targetRaceDate,
    targetWeeklyRunMinutes: input.targetWeeklyRunMinutes,
  };
}

export interface InsertRunPlanInput {
  targetRaceDistance: string | null;
  targetRaceDate: string | null;
  weeksTotal: number;
  // Set when this run plan is a tri plan's run sub-plan rather than a
  // standalone plan — see supabase/migrations/20260611000001_runner_tables.sql.
  triPlanId?: string | null;
}

export async function insertRunPlan(
  db: Db,
  userId: string,
  input: InsertRunPlanInput
): Promise<{ id: string }> {
  const { data, error } = await db
    .from('run_plans')
    .insert({
      user_id: userId,
      tri_plan_id: input.triPlanId ?? null,
      target_race_distance: input.targetRaceDistance,
      target_race_date: input.targetRaceDate,
      weeks_total: input.weeksTotal,
    })
    .select()
    .single();
  if (error) throw error;

  return { id: data.id };
}

export async function insertRunWorkouts(
  db: Db,
  planId: string,
  workouts: RunWorkout[]
): Promise<void> {
  const { error } = await db.from('run_workouts').insert(
    workouts.map((w) => ({
      plan_id: planId,
      week_number: w.weekNumber,
      phase: w.phase,
      weekly_volume_minutes: w.weeklyVolumeMinutes,
      day_of_week: w.dayOfWeek,
      workout_type: w.workoutType,
      description: w.description,
      target_distance_meters: w.targetDistanceMeters,
      target_distance_miles: w.targetDistanceMiles,
      target_pace_zone: w.targetPaceZone,
      target_pace_min: w.targetPaceMin,
      target_pace_max: w.targetPaceMax,
    }))
  );
  if (error) throw error;
}
