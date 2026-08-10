import { createServerClient } from '@/lib/supabase/server';
import type { TriPreferences, TriPlanWeek } from '@/services/plan-engine';
import type { TriRaceDistance } from '@/services/plan-engine/tri/types';

type Db = ReturnType<typeof createServerClient>;

// lib/plans/tri-plans.ts
// Persistence layer for the composite triathlon plan itself (tri_preferences,
// tri_plans, tri_plan_weeks). A tri plan's actual sport sessions are
// standalone run/cycling/swim plans stamped with tri_plan_id — those reuse
// insertRunnerProfile/insertRunPlan/insertRunWorkouts (and the cycling/swim
// equivalents) from lib/plans/run-plans.ts, cycling-plans.ts, swim-plans.ts
// rather than duplicating them here.

export interface InsertTriPreferencesInput {
  hoursPerWeek: number;
  runDays: number[];
  bikeDays: number[];
  swimDays: number[];
  longRunDay?: number;
  longRideDay?: number;
  targetRaceDistance: TriRaceDistance;
  targetRaceDate: string;
}

export async function insertTriPreferences(
  db: Db,
  userId: string,
  input: InsertTriPreferencesInput
): Promise<TriPreferences> {
  const { data, error } = await db
    .from('tri_preferences')
    .insert({
      user_id: userId,
      hours_per_week: input.hoursPerWeek,
      run_days: input.runDays,
      bike_days: input.bikeDays,
      swim_days: input.swimDays,
      long_run_day: input.longRunDay ?? null,
      long_ride_day: input.longRideDay ?? null,
      target_race_distance: input.targetRaceDistance,
      target_race_date: input.targetRaceDate,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    userId,
    hoursPerWeek: input.hoursPerWeek,
    runDays: input.runDays,
    bikeDays: input.bikeDays,
    swimDays: input.swimDays,
    longRunDay: input.longRunDay,
    longRideDay: input.longRideDay,
    targetRaceDistance: input.targetRaceDistance,
    targetRaceDate: input.targetRaceDate,
  };
}

export interface InsertTriPlanInput {
  targetRaceDistance: TriRaceDistance;
  targetRaceDate: string;
  weeksTotal: number;
  hoursPerWeek: number;
}

export async function insertTriPlan(
  db: Db,
  userId: string,
  input: InsertTriPlanInput
): Promise<{ id: string }> {
  const { data, error } = await db
    .from('tri_plans')
    .insert({
      user_id: userId,
      target_race_distance: input.targetRaceDistance,
      target_race_date: input.targetRaceDate,
      weeks_total: input.weeksTotal,
      hours_per_week: input.hoursPerWeek,
    })
    .select()
    .single();
  if (error) throw error;

  return { id: data.id };
}

export async function insertTriPlanWeeks(
  db: Db,
  triPlanId: string,
  weeks: TriPlanWeek[]
): Promise<void> {
  const { error } = await db.from('tri_plan_weeks').insert(
    weeks.map((w) => ({
      tri_plan_id: triPlanId,
      week_number: w.weekNumber,
      total_hours_allocated: w.totalHoursAllocated,
      run_hours: w.runHours,
      bike_hours: w.bikeHours,
      swim_hours: w.swimHours,
    }))
  );
  if (error) throw error;
}
