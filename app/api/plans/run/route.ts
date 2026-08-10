import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { generateRunPlanRequestSchema } from '@/lib/schemas/plan-request-run';
import { deriveVdot, generateRunPlan } from '@/services/plan-engine';
import type { RunnerProfile, RunPreferences } from '@/services/plan-engine';

// POST /api/plans/run
// Onboarding submission endpoint for a standalone run plan — inserts the
// runner profile + preferences, generates the plan via the plan-engine, and
// persists the resulting run_plans + run_workouts rows.
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
export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = generateRunPlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const db = createServerClient();

  try {
    const vdot = deriveVdot(input.profile.seedDistance, input.profile.seedTimeSeconds);

    const { data: profileRow, error: profileError } = await db
      .from('runner_profiles')
      .insert({
        user_id: userId,
        vdot,
        seed_distance: input.profile.seedDistance,
        seed_time_seconds: input.profile.seedTimeSeconds,
      })
      .select()
      .single();
    if (profileError) throw profileError;

    const { data: prefsRow, error: prefsError } = await db
      .from('run_preferences')
      .insert({
        user_id: userId,
        training_days: input.preferences.trainingDays,
        long_run_day: input.preferences.longRunDay,
        goal_type: input.preferences.goalType,
        target_race_distance: input.preferences.targetRaceDistance ?? null,
        target_race_date: input.preferences.targetRaceDate ?? null,
        target_weekly_run_minutes: input.preferences.targetWeeklyRunMinutes,
      })
      .select()
      .single();
    if (prefsError) throw prefsError;

    const profile: RunnerProfile = {
      id: profileRow.id,
      userId,
      vdot,
      seedDistance: input.profile.seedDistance,
      seedTimeSeconds: input.profile.seedTimeSeconds,
      updatedAt: profileRow.updated_at,
    };
    const preferences: RunPreferences = {
      id: prefsRow.id,
      userId,
      trainingDays: input.preferences.trainingDays,
      longRunDay: input.preferences.longRunDay,
      goalType: input.preferences.goalType,
      targetRaceDistance: input.preferences.targetRaceDistance ?? null,
      targetRaceDate: input.preferences.targetRaceDate ?? null,
      targetWeeklyRunMinutes: input.preferences.targetWeeklyRunMinutes,
    };

    const workouts = generateRunPlan(profile, preferences);
    const weeksTotal = new Set(workouts.map((w) => w.weekNumber)).size;

    const { data: planRow, error: planError } = await db
      .from('run_plans')
      .insert({
        user_id: userId,
        target_race_distance: preferences.targetRaceDistance,
        target_race_date: preferences.targetRaceDate,
        weeks_total: weeksTotal,
      })
      .select()
      .single();
    if (planError) throw planError;

    const { error: workoutsError } = await db.from('run_workouts').insert(
      workouts.map((w) => ({
        plan_id: planRow.id,
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
    if (workoutsError) throw workoutsError;

    return NextResponse.json({ planId: planRow.id, weeksTotal }, { status: 201 });
  } catch (err) {
    console.error('[plans/run] error:', err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
