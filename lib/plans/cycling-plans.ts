import { createServerClient } from '@/lib/supabase/server';
import type { CyclistProfile, CyclingPreferences, CyclingWorkout } from '@/services/plan-engine';

export type Db = ReturnType<typeof createServerClient>;

// lib/plans/cycling-plans.ts
// Persistence layer for cycling plans — every raw Supabase call for the
// `cycling` sport lives here so app/api/plans/cycling/route.ts and the tri
// orchestrator (services/plan-onboarding/tri.ts) can both call these without
// duplicating insert payload shapes.
//
// Each function throws on a DB error rather than returning a Result-style
// object — callers already wrap their orchestration in a try/catch and turn
// any thrown error into a 500, so this keeps error handling in one place.

export interface InsertCyclistProfileInput {
  ftpWatts: number;
  weightKg: number | null;
}

export async function insertCyclistProfile(
  db: Db,
  userId: string,
  input: InsertCyclistProfileInput
): Promise<CyclistProfile> {
  const { data, error } = await db
    .from('cyclist_profiles')
    .insert({
      user_id: userId,
      ftp_watts: input.ftpWatts,
      weight_kg: input.weightKg,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    userId,
    ftpWatts: input.ftpWatts,
    weightKg: input.weightKg,
    updatedAt: data.updated_at,
  };
}

export interface InsertCyclingPreferencesInput {
  trainingDays: number[];
  longRideDay: number;
  goalType: CyclingPreferences['goalType'];
  targetEvent: string | null;
  targetEventDate: string | null;
  targetWeeklyRideMinutes: number;
}

export async function insertCyclingPreferences(
  db: Db,
  userId: string,
  input: InsertCyclingPreferencesInput
): Promise<CyclingPreferences> {
  const { data, error } = await db
    .from('cycling_preferences')
    .insert({
      user_id: userId,
      training_days: input.trainingDays,
      long_ride_day: input.longRideDay,
      goal_type: input.goalType,
      target_event: input.targetEvent,
      target_event_date: input.targetEventDate,
      target_weekly_ride_minutes: input.targetWeeklyRideMinutes,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    userId,
    trainingDays: input.trainingDays,
    longRideDay: input.longRideDay,
    goalType: input.goalType,
    targetEvent: input.targetEvent,
    targetEventDate: input.targetEventDate,
    targetWeeklyRideMinutes: input.targetWeeklyRideMinutes,
  };
}

export interface InsertCyclingPlanInput {
  targetEvent: string | null;
  targetEventDate: string | null;
  weeksTotal: number;
  // Set when this cycling plan is a tri plan's bike sub-plan rather than a
  // standalone plan — see supabase/migrations/20260611000002_cyclist_tables.sql.
  triPlanId?: string | null;
}

export async function insertCyclingPlan(
  db: Db,
  userId: string,
  input: InsertCyclingPlanInput
): Promise<{ id: string }> {
  const { data, error } = await db
    .from('cycling_plans')
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

export async function insertCyclingWorkouts(
  db: Db,
  planId: string,
  workouts: CyclingWorkout[]
): Promise<void> {
  const { error } = await db.from('cycling_workouts').insert(
    workouts.map((w) => ({
      plan_id: planId,
      week_number: w.weekNumber,
      phase: w.phase,
      weekly_volume_minutes: w.weeklyVolumeMinutes,
      day_of_week: w.dayOfWeek,
      workout_type: w.workoutType,
      description: w.description,
      target_duration_minutes: w.targetDurationMinutes,
      target_power_zone: w.targetPowerZone,
      target_power_min_watts: w.targetPowerMinWatts,
      target_power_max_watts: w.targetPowerMaxWatts,
      tss: w.tss,
      cadence_rpm: w.cadenceRpm,
      cadence_max_rpm: w.cadenceMaxRpm,
      watts_per_kg: w.wattsPerKg,
    }))
  );
  if (error) throw error;
}
