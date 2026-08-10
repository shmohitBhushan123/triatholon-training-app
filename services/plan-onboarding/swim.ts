import { generateSwimPlan } from '@/services/plan-engine';
import type { GenerateSwimPlanRequest } from '@/lib/schemas/plan-request-swim';
import {
  insertSwimmerProfile,
  insertSwimPreferences,
  insertSwimPlan,
  insertSwimWorkouts,
  type Db,
} from '@/lib/plans/swim-plans';

// services/plan-onboarding/swim.ts
// Orchestrates a swim-plan onboarding submission: derives CSS from the two
// time trials, persists the profile/preferences, generates the plan via the
// plan-engine, and persists the resulting plan + workouts. See
// services/plan-onboarding/run.ts for the rationale behind this
// handler/service/repository split.
//
// Errors are left to propagate (not caught here) — the caller (route
// handler) wraps this call in a try/catch and turns any thrown error into a
// 500 response.
//
// NOTE: profile/preference rows are inserted fresh on every call rather than
// upserted — swimmer_profiles/swim_preferences have no unique constraint on
// user_id, so a true upsert isn't possible without a schema migration.
// Re-submitting onboarding currently creates additional profile rows.
// Acceptable for MVP/POC scope; revisit if repeat-onboarding becomes a real
// use case.
//
// NOTE: writes are sequential, not wrapped in a single DB transaction —
// supabase-js doesn't support multi-table transactions without a Postgres RPC
// function. Acceptable for a single low-concurrency user at MVP scope.
export async function createSwimPlan(
  db: Db,
  userId: string,
  input: GenerateSwimPlanRequest
): Promise<{ planId: string; weeksTotal: number }> {
  // CSS derivation — see supabase/migrations/20260611000003_swimmer_tables.sql
  const cssPer100ydSeconds = (input.profile.tt400Seconds - input.profile.tt200Seconds) / 2;

  const profile = await insertSwimmerProfile(db, userId, {
    cssPer100ydSeconds,
    tt400Seconds: input.profile.tt400Seconds,
    tt200Seconds: input.profile.tt200Seconds,
  });

  const preferences = await insertSwimPreferences(db, userId, {
    trainingDays: input.preferences.trainingDays,
    goalType: input.preferences.goalType,
    targetEvent: input.preferences.targetEvent ?? null,
    targetEventDate: input.preferences.targetEventDate ?? null,
    targetWeeklySwimYards: input.preferences.targetWeeklySwimYards,
  });

  const workouts = generateSwimPlan(profile, preferences);
  const weeksTotal = new Set(workouts.map((w) => w.weekNumber)).size;

  const plan = await insertSwimPlan(db, userId, {
    targetEvent: preferences.targetEvent,
    targetEventDate: preferences.targetEventDate,
    weeksTotal,
  });

  await insertSwimWorkouts(db, plan.id, workouts);

  return { planId: plan.id, weeksTotal };
}
