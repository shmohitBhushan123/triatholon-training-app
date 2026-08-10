import { generateCyclingPlan } from '@/services/plan-engine';
import type { GenerateCyclingPlanRequest } from '@/lib/schemas/plan-request-cycling';
import {
  insertCyclistProfile,
  insertCyclingPreferences,
  insertCyclingPlan,
  insertCyclingWorkouts,
  type Db,
} from '@/lib/plans/cycling-plans';

// services/plan-onboarding/cycling.ts
// Orchestrates a cycling-plan onboarding submission: persists the profile/
// preferences, generates the plan via the plan-engine, and persists the
// resulting plan + workouts. See services/plan-onboarding/run.ts for the
// rationale behind this handler/service/repository split.
//
// Errors are left to propagate (not caught here) — the caller (route
// handler) wraps this call in a try/catch and turns any thrown error into a
// 500 response.
//
// NOTE: profile/preference rows are inserted fresh on every call rather than
// upserted — cyclist_profiles/cycling_preferences have no unique constraint
// on user_id, so a true upsert isn't possible without a schema migration.
// Re-submitting onboarding currently creates additional profile rows.
// Acceptable for MVP/POC scope; revisit if repeat-onboarding becomes a real
// use case.
//
// NOTE: writes are sequential, not wrapped in a single DB transaction —
// supabase-js doesn't support multi-table transactions without a Postgres RPC
// function. Acceptable for a single low-concurrency user at MVP scope.
export async function createCyclingPlan(
  db: Db,
  userId: string,
  input: GenerateCyclingPlanRequest
): Promise<{ planId: string; weeksTotal: number }> {
  const profile = await insertCyclistProfile(db, userId, {
    ftpWatts: input.profile.ftpWatts,
    weightKg: input.profile.weightKg ?? null,
  });

  const preferences = await insertCyclingPreferences(db, userId, {
    trainingDays: input.preferences.trainingDays,
    longRideDay: input.preferences.longRideDay,
    goalType: input.preferences.goalType,
    targetEvent: input.preferences.targetEvent ?? null,
    targetEventDate: input.preferences.targetEventDate ?? null,
    targetWeeklyRideMinutes: input.preferences.targetWeeklyRideMinutes,
  });

  const workouts = generateCyclingPlan(profile, preferences);
  const weeksTotal = new Set(workouts.map((w) => w.weekNumber)).size;

  const plan = await insertCyclingPlan(db, userId, {
    targetEvent: preferences.targetEvent,
    targetEventDate: preferences.targetEventDate,
    weeksTotal,
  });

  await insertCyclingWorkouts(db, plan.id, workouts);

  return { planId: plan.id, weeksTotal };
}
