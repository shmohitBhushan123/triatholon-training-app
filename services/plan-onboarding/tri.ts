import { deriveVdot, generateTriPlan } from '@/services/plan-engine';
import type { GenerateTriPlanRequest } from '@/lib/schemas/plan-request-tri';
import type {
  RunnerProfile,
  CyclistProfile,
  SwimmerProfile,
  TriPreferences,
} from '@/services/plan-engine';
import {
  insertRunnerProfile,
  insertRunPlan,
  insertRunWorkouts,
  type Db,
} from '@/lib/plans/run-plans';
import {
  insertCyclistProfile,
  insertCyclingPlan,
  insertCyclingWorkouts,
} from '@/lib/plans/cycling-plans';
import { insertSwimmerProfile, insertSwimPlan, insertSwimWorkouts } from '@/lib/plans/swim-plans';
import { insertTriPreferences, insertTriPlan, insertTriPlanWeeks } from '@/lib/plans/tri-plans';

// services/plan-onboarding/tri.ts
// Orchestrates a composite triathlon-plan onboarding submission: persists all
// three sport profiles + tri preferences (in parallel), generates the plan
// via the plan-engine's orchestrator, and persists tri_plans/tri_plan_weeks
// plus each sport's sub-plan + workouts (stamped with tri_plan_id).
//
// Reuses insertRunnerProfile/insertRunPlan/insertRunWorkouts (and the
// cycling/swim equivalents) from the single-sport repositories rather than
// duplicating them — a tri plan's sessions live in the same
// run_workouts/cycling_workouts/swim_workouts tables as standalone plans,
// just under sub-plans stamped with tri_plan_id. See
// services/plan-onboarding/run.ts for the rationale behind this
// handler/service/repository split.
//
// Errors are left to propagate (not caught here) — the caller (route
// handler) wraps this call in a try/catch and turns any thrown error into a
// 500 response.
//
// NOTE: profile/preference rows are inserted fresh on every call rather than
// upserted — none of the profile tables have a unique constraint on user_id,
// so a true upsert isn't possible without a schema migration. Re-submitting
// onboarding currently creates additional profile rows. Acceptable for MVP/POC
// scope; revisit if repeat-onboarding becomes a real use case.
//
// NOTE: writes are sequential, not wrapped in a single DB transaction —
// supabase-js doesn't support multi-table transactions without a Postgres RPC
// function. Acceptable for a single low-concurrency user at MVP scope.
export async function createTriPlan(
  db: Db,
  userId: string,
  input: GenerateTriPlanRequest
): Promise<{ triPlanId: string; weeksTotal: number }> {
  const runVdot = deriveVdot(input.runProfile.seedDistance, input.runProfile.seedTimeSeconds);
  const swimCss = (input.swimProfile.tt400Seconds - input.swimProfile.tt200Seconds) / 2;

  const [runProfileRow, cyclingProfileRow, swimProfileRow, triPrefs] = await Promise.all([
    insertRunnerProfile(db, userId, {
      vdot: runVdot,
      seedDistance: input.runProfile.seedDistance,
      seedTimeSeconds: input.runProfile.seedTimeSeconds,
    }),
    insertCyclistProfile(db, userId, {
      ftpWatts: input.cyclingProfile.ftpWatts,
      weightKg: input.cyclingProfile.weightKg ?? null,
    }),
    insertSwimmerProfile(db, userId, {
      cssPer100ydSeconds: swimCss,
      tt400Seconds: input.swimProfile.tt400Seconds,
      tt200Seconds: input.swimProfile.tt200Seconds,
    }),
    insertTriPreferences(db, userId, {
      hoursPerWeek: input.preferences.hoursPerWeek,
      runDays: input.preferences.runDays,
      bikeDays: input.preferences.bikeDays,
      swimDays: input.preferences.swimDays,
      longRunDay: input.preferences.longRunDay,
      longRideDay: input.preferences.longRideDay,
      targetRaceDistance: input.preferences.targetRaceDistance,
      targetRaceDate: input.preferences.targetRaceDate,
    }),
  ]);

  const runProfile: RunnerProfile = runProfileRow;
  const cyclingProfile: CyclistProfile = cyclingProfileRow;
  const swimProfile: SwimmerProfile = swimProfileRow;
  const preferences: TriPreferences = triPrefs;

  const result = generateTriPlan(runProfile, cyclingProfile, swimProfile, preferences);

  const triPlan = await insertTriPlan(db, userId, {
    targetRaceDistance: preferences.targetRaceDistance,
    targetRaceDate: preferences.targetRaceDate,
    weeksTotal: result.weeks.length,
    hoursPerWeek: preferences.hoursPerWeek,
  });

  await insertTriPlanWeeks(db, triPlan.id, result.weeks);

  const runPlan = await insertRunPlan(db, userId, {
    triPlanId: triPlan.id,
    targetRaceDistance: preferences.targetRaceDistance,
    targetRaceDate: preferences.targetRaceDate,
    weeksTotal: result.weeks.length,
  });

  const cyclingPlan = await insertCyclingPlan(db, userId, {
    triPlanId: triPlan.id,
    targetEvent: preferences.targetRaceDistance,
    targetEventDate: preferences.targetRaceDate,
    weeksTotal: result.weeks.length,
  });

  const swimPlan = await insertSwimPlan(db, userId, {
    triPlanId: triPlan.id,
    targetEvent: preferences.targetRaceDistance,
    targetEventDate: preferences.targetRaceDate,
    weeksTotal: result.weeks.length,
  });

  await Promise.all([
    insertRunWorkouts(db, runPlan.id, result.runWorkouts),
    insertCyclingWorkouts(db, cyclingPlan.id, result.cyclingWorkouts),
    insertSwimWorkouts(db, swimPlan.id, result.swimWorkouts),
  ]);

  return { triPlanId: triPlan.id, weeksTotal: result.weeks.length };
}
