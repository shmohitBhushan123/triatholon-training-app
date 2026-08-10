import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { generateCyclingPlanRequestSchema } from '@/lib/schemas/plan-request-cycling';
import { generateCyclingPlan } from '@/services/plan-engine';
import type { CyclistProfile, CyclingPreferences } from '@/services/plan-engine';

// POST /api/plans/cycling
// Onboarding submission endpoint for a standalone cycling plan — inserts the
// cyclist profile + preferences, generates the plan via the plan-engine, and
// persists the resulting cycling_plans + cycling_workouts rows.
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

  const parsed = generateCyclingPlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const db = createServerClient();

  try {
    const { data: profileRow, error: profileError } = await db
      .from('cyclist_profiles')
      .insert({
        user_id: userId,
        ftp_watts: input.profile.ftpWatts,
        weight_kg: input.profile.weightKg ?? null,
      })
      .select()
      .single();
    if (profileError) throw profileError;

    const { data: prefsRow, error: prefsError } = await db
      .from('cycling_preferences')
      .insert({
        user_id: userId,
        training_days: input.preferences.trainingDays,
        long_ride_day: input.preferences.longRideDay,
        goal_type: input.preferences.goalType,
        target_event: input.preferences.targetEvent ?? null,
        target_event_date: input.preferences.targetEventDate ?? null,
        target_weekly_ride_minutes: input.preferences.targetWeeklyRideMinutes,
      })
      .select()
      .single();
    if (prefsError) throw prefsError;

    const profile: CyclistProfile = {
      id: profileRow.id,
      userId,
      ftpWatts: input.profile.ftpWatts,
      weightKg: input.profile.weightKg ?? null,
      updatedAt: profileRow.updated_at,
    };
    const preferences: CyclingPreferences = {
      id: prefsRow.id,
      userId,
      trainingDays: input.preferences.trainingDays,
      longRideDay: input.preferences.longRideDay,
      goalType: input.preferences.goalType,
      targetEvent: input.preferences.targetEvent ?? null,
      targetEventDate: input.preferences.targetEventDate ?? null,
      targetWeeklyRideMinutes: input.preferences.targetWeeklyRideMinutes,
    };

    const workouts = generateCyclingPlan(profile, preferences);
    const weeksTotal = new Set(workouts.map((w) => w.weekNumber)).size;

    const { data: planRow, error: planError } = await db
      .from('cycling_plans')
      .insert({
        user_id: userId,
        target_event: preferences.targetEvent,
        target_event_date: preferences.targetEventDate,
        weeks_total: weeksTotal,
      })
      .select()
      .single();
    if (planError) throw planError;

    const { error: workoutsError } = await db.from('cycling_workouts').insert(
      workouts.map((w) => ({
        plan_id: planRow.id,
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
    if (workoutsError) throw workoutsError;

    return NextResponse.json({ planId: planRow.id, weeksTotal }, { status: 201 });
  } catch (err) {
    console.error('[plans/cycling] error:', err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
