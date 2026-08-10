import { deriveVdot, generateRunPlan } from '@/services/plan-engine';
import type { GenerateRunPlanRequest } from '@/lib/schemas/plan-request-run';
import {
  insertRunnerProfile,
  insertRunPreferences,
  insertRunPlan,
  insertRunWorkouts,
  type Db,
} from '@/lib/plans/run-plans';

// services/plan-onboarding/run.ts
// Orchestrates a run-plan onboarding submission: derives VDOT, persists the
// profile/preferences, generates the plan via the plan-engine, and persists
// the resulting plan + workouts.
//
// This is the "business logic" layer between the HTTP handler
// (app/api/plans/run/route.ts) and the persistence layer
// (lib/plans/run-plans.ts) — the route only handles auth/parsing/response
// shaping, and never touches Supabase or the plan-engine directly.
//
// Errors are left to propagate (not caught here) — the caller (route
// handler) wraps this call in a try/catch and turns any thrown error into a
// 500 response.
//
// NOTE: profile/preference rows are inserted fresh on every call rather than
// upserted — runner_profiles/run_preferences have no unique constraint on
// user_id, so a true upsert isn't possible without a schema migration.
// Re-submitting onboarding currently creates additional profile rows.
// Acceptable for MVP/POC scope; revisit if repeat-onboarding becomes a real
// use case.
//
// NOTE: writes are sequential, not wrapped in a single DB transaction —
// supabase-js doesn't support multi-table transactions without a Postgres RPC
// function. Acceptable for a single low-concurrency user at MVP scope.
export async function createRunPlan(
  db: Db,
  userId: string,
  input: GenerateRunPlanRequest
): Promise<{ planId: string; weeksTotal: number }> {
  const vdot = deriveVdot(input.profile.seedDistance, input.profile.seedTimeSeconds);

  const profile = await insertRunnerProfile(db, userId, {
    vdot,
    seedDistance: input.profile.seedDistance,
    seedTimeSeconds: input.profile.seedTimeSeconds,
  });

  const preferences = await insertRunPreferences(db, userId, {
    trainingDays: input.preferences.trainingDays,
    longRunDay: input.preferences.longRunDay,
    goalType: input.preferences.goalType,
    targetRaceDistance: input.preferences.targetRaceDistance ?? null,
    targetRaceDate: input.preferences.targetRaceDate ?? null,
    targetWeeklyRunMinutes: input.preferences.targetWeeklyRunMinutes,
  });

  const workouts = generateRunPlan(profile, preferences);
  const weeksTotal = new Set(workouts.map((w) => w.weekNumber)).size;

  const plan = await insertRunPlan(db, userId, {
    targetRaceDistance: preferences.targetRaceDistance,
    targetRaceDate: preferences.targetRaceDate,
    weeksTotal,
  });

  await insertRunWorkouts(db, plan.id, workouts);

  return { planId: plan.id, weeksTotal };
}
