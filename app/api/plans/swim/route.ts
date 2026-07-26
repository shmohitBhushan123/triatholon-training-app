import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { generateSwimPlanRequestSchema } from '@/lib/schemas/plan-request-swim';
import { generateSwimPlan } from '@/services/plan-engine';
import type { SwimmerProfile, SwimPreferences } from '@/services/plan-engine';

// POST /api/plans/swim
// Onboarding submission endpoint for a standalone swim plan — inserts the
// swimmer profile + preferences, generates the plan via the plan-engine, and
// persists the resulting swim_plans + swim_workouts rows.
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

  const parsed = generateSwimPlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const db = createServerClient();

  try {
    // CSS derivation — see supabase/migrations/20260611000003_swimmer_tables.sql
    const cssPer100ydSeconds = (input.profile.tt400Seconds - input.profile.tt200Seconds) / 2;

    const { data: profileRow, error: profileError } = await db
      .from('swimmer_profiles')
      .insert({
        user_id: userId,
        css_per_100yd_seconds: cssPer100ydSeconds,
        tt400_seconds: input.profile.tt400Seconds,
        tt200_seconds: input.profile.tt200Seconds,
      })
      .select()
      .single();
    if (profileError) throw profileError;

    const { data: prefsRow, error: prefsError } = await db
      .from('swim_preferences')
      .insert({
        user_id: userId,
        training_days: input.preferences.trainingDays,
        goal_type: input.preferences.goalType,
        target_event: input.preferences.targetEvent ?? null,
        target_event_date: input.preferences.targetEventDate ?? null,
      })
      .select()
      .single();
    if (prefsError) throw prefsError;

    const profile: SwimmerProfile = {
      id: profileRow.id,
      userId,
      cssPer100ydSeconds,
      tt400Seconds: input.profile.tt400Seconds,
      tt200Seconds: input.profile.tt200Seconds,
      updatedAt: profileRow.updated_at,
    };
    const preferences: SwimPreferences = {
      id: prefsRow.id,
      userId,
      trainingDays: input.preferences.trainingDays,
      goalType: input.preferences.goalType,
      targetEvent: input.preferences.targetEvent ?? null,
      targetEventDate: input.preferences.targetEventDate ?? null,
      targetWeeklySwimYards: input.preferences.targetWeeklySwimYards,
    };

    const workouts = generateSwimPlan(profile, preferences);
    const weeksTotal = new Set(workouts.map((w) => w.weekNumber)).size;

    const { data: planRow, error: planError } = await db
      .from('swim_plans')
      .insert({
        user_id: userId,
        target_event: preferences.targetEvent,
        target_event_date: preferences.targetEventDate,
        weeks_total: weeksTotal,
      })
      .select()
      .single();
    if (planError) throw planError;

    const { error: workoutsError } = await db.from('swim_workouts').insert(
      workouts.map((w) => ({
        plan_id: planRow.id,
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
    if (workoutsError) throw workoutsError;

    return NextResponse.json({ planId: planRow.id, weeksTotal }, { status: 201 });
  } catch (err) {
    console.error('[plans/swim] error:', err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
