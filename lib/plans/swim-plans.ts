import { createServerClient } from '@/lib/supabase/server';
import type { SwimmerProfile, SwimPreferences, SwimWorkout } from '@/services/plan-engine';

export type Db = ReturnType<typeof createServerClient>;

// lib/plans/swim-plans.ts
// Persistence layer for swim plans — every raw Supabase call for the `swim`
// sport lives here so app/api/plans/swim/route.ts and the tri orchestrator
// (services/plan-onboarding/tri.ts) can both call these without duplicating
// insert payload shapes.
//
// Each function throws on a DB error rather than returning a Result-style
// object — callers already wrap their orchestration in a try/catch and turn
// any thrown error into a 500, so this keeps error handling in one place.

export interface InsertSwimmerProfileInput {
  cssPer100ydSeconds: number;
  tt400Seconds: number;
  tt200Seconds: number;
}

export async function insertSwimmerProfile(
  db: Db,
  userId: string,
  input: InsertSwimmerProfileInput
): Promise<SwimmerProfile> {
  const { data, error } = await db
    .from('swimmer_profiles')
    .insert({
      user_id: userId,
      css_per_100yd_seconds: input.cssPer100ydSeconds,
      tt400_seconds: input.tt400Seconds,
      tt200_seconds: input.tt200Seconds,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    userId,
    cssPer100ydSeconds: input.cssPer100ydSeconds,
    tt400Seconds: input.tt400Seconds,
    tt200Seconds: input.tt200Seconds,
    updatedAt: data.updated_at,
  };
}

export interface InsertSwimPreferencesInput {
  trainingDays: number[];
  goalType: SwimPreferences['goalType'];
  targetEvent: string | null;
  targetEventDate: string | null;
  targetWeeklySwimYards?: number;
}

export async function insertSwimPreferences(
  db: Db,
  userId: string,
  input: InsertSwimPreferencesInput
): Promise<SwimPreferences> {
  const { data, error } = await db
    .from('swim_preferences')
    .insert({
      user_id: userId,
      training_days: input.trainingDays,
      goal_type: input.goalType,
      target_event: input.targetEvent,
      target_event_date: input.targetEventDate,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    userId,
    trainingDays: input.trainingDays,
    goalType: input.goalType,
    targetEvent: input.targetEvent,
    targetEventDate: input.targetEventDate,
    targetWeeklySwimYards: input.targetWeeklySwimYards,
  };
}

export interface InsertSwimPlanInput {
  targetEvent: string | null;
  targetEventDate: string | null;
  weeksTotal: number;
  // Set when this swim plan is a tri plan's swim sub-plan rather than a
  // standalone plan — see supabase/migrations/20260611000003_swimmer_tables.sql.
  triPlanId?: string | null;
}

export async function insertSwimPlan(
  db: Db,
  userId: string,
  input: InsertSwimPlanInput
): Promise<{ id: string }> {
  const { data, error } = await db
    .from('swim_plans')
    .insert({
      user_id: userId,
      tri_plan_id: input.triPlanId ?? null,
      target_event: input.targetEvent,
      target_event_date: input.targetEventDate,
      weeks_total: input.weeksTotal,
    })
    .select()
    .single();
  if (error) throw error;

  return { id: data.id };
}

export async function insertSwimWorkouts(
  db: Db,
  planId: string,
  workouts: SwimWorkout[]
): Promise<void> {
  const { error } = await db.from('swim_workouts').insert(
    workouts.map((w) => ({
      plan_id: planId,
      week_number: w.weekNumber,
      phase: w.phase,
      weekly_volume_yards: w.weeklyVolumeYards,
      day_of_week: w.dayOfWeek,
      workout_type: w.workoutType,
      description: w.description,
      target_distance_meters: w.targetDistanceMeters,
      target_css_zone: w.targetCssZone,
      target_pace_min: w.targetPaceMin,
      target_pace_max: w.targetPaceMax,
    }))
  );
  if (error) throw error;
}
