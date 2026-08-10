import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { generateTriPlanRequestSchema } from '@/lib/schemas/plan-request-tri';
import { deriveVdot, generateTriPlan } from '@/services/plan-engine';
import type {
  RunnerProfile,
  CyclistProfile,
  SwimmerProfile,
  TriPreferences,
} from '@/services/plan-engine';

// POST /api/plans/tri
// Onboarding submission endpoint for a composite triathlon plan — inserts all
// three sport profiles + tri preferences, generates the plan via the
// plan-engine's orchestrator, and persists tri_plans/tri_plan_weeks plus each
// sport's plans + workouts (with tri_plan_id set on each sub-plan).
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

  const parsed = generateTriPlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const db = createServerClient();

  try {
    const runVdot = deriveVdot(input.runProfile.seedDistance, input.runProfile.seedTimeSeconds);
    const swimCss = (input.swimProfile.tt400Seconds - input.swimProfile.tt200Seconds) / 2;

    const [runProfileRes, cyclingProfileRes, swimProfileRes, triPrefsRes] = await Promise.all([
      db
        .from('runner_profiles')
        .insert({
          user_id: userId,
          vdot: runVdot,
          seed_distance: input.runProfile.seedDistance,
          seed_time_seconds: input.runProfile.seedTimeSeconds,
        })
        .select()
        .single(),
      db
        .from('cyclist_profiles')
        .insert({
          user_id: userId,
          ftp_watts: input.cyclingProfile.ftpWatts,
          weight_kg: input.cyclingProfile.weightKg ?? null,
        })
        .select()
        .single(),
      db
        .from('swimmer_profiles')
        .insert({
          user_id: userId,
          css_per_100yd_seconds: swimCss,
          tt400_seconds: input.swimProfile.tt400Seconds,
          tt200_seconds: input.swimProfile.tt200Seconds,
        })
        .select()
        .single(),
      db
        .from('tri_preferences')
        .insert({
          user_id: userId,
          hours_per_week: input.preferences.hoursPerWeek,
          run_days: input.preferences.runDays,
          bike_days: input.preferences.bikeDays,
          swim_days: input.preferences.swimDays,
          long_run_day: input.preferences.longRunDay ?? null,
          long_ride_day: input.preferences.longRideDay ?? null,
          target_race_distance: input.preferences.targetRaceDistance,
          target_race_date: input.preferences.targetRaceDate,
        })
        .select()
        .single(),
    ]);

    if (runProfileRes.error) throw runProfileRes.error;
    if (cyclingProfileRes.error) throw cyclingProfileRes.error;
    if (swimProfileRes.error) throw swimProfileRes.error;
    if (triPrefsRes.error) throw triPrefsRes.error;

    const runProfile: RunnerProfile = {
      id: runProfileRes.data.id,
      userId,
      vdot: runVdot,
      seedDistance: input.runProfile.seedDistance,
      seedTimeSeconds: input.runProfile.seedTimeSeconds,
      updatedAt: runProfileRes.data.updated_at,
    };
    const cyclingProfile: CyclistProfile = {
      id: cyclingProfileRes.data.id,
      userId,
      ftpWatts: input.cyclingProfile.ftpWatts,
      weightKg: input.cyclingProfile.weightKg ?? null,
      updatedAt: cyclingProfileRes.data.updated_at,
    };
    const swimProfile: SwimmerProfile = {
      id: swimProfileRes.data.id,
      userId,
      cssPer100ydSeconds: swimCss,
      tt400Seconds: input.swimProfile.tt400Seconds,
      tt200Seconds: input.swimProfile.tt200Seconds,
      updatedAt: swimProfileRes.data.updated_at,
    };
    const preferences: TriPreferences = {
      id: triPrefsRes.data.id,
      userId,
      hoursPerWeek: input.preferences.hoursPerWeek,
      runDays: input.preferences.runDays,
      bikeDays: input.preferences.bikeDays,
      swimDays: input.preferences.swimDays,
      longRunDay: input.preferences.longRunDay,
      longRideDay: input.preferences.longRideDay,
      targetRaceDistance: input.preferences.targetRaceDistance,
      targetRaceDate: input.preferences.targetRaceDate,
    };

    const result = generateTriPlan(runProfile, cyclingProfile, swimProfile, preferences);

    const { data: triPlanRow, error: triPlanError } = await db
      .from('tri_plans')
      .insert({
        user_id: userId,
        target_race_distance: preferences.targetRaceDistance,
        target_race_date: preferences.targetRaceDate,
        weeks_total: result.weeks.length,
        hours_per_week: preferences.hoursPerWeek,
      })
      .select()
      .single();
    if (triPlanError) throw triPlanError;

    const triPlanId = triPlanRow.id;

    const { error: weeksError } = await db.from('tri_plan_weeks').insert(
      result.weeks.map((w) => ({
        tri_plan_id: triPlanId,
        week_number: w.weekNumber,
        total_hours_allocated: w.totalHoursAllocated,
        run_hours: w.runHours,
        bike_hours: w.bikeHours,
        swim_hours: w.swimHours,
      }))
    );
    if (weeksError) throw weeksError;

    const { data: runPlanRow, error: runPlanError } = await db
      .from('run_plans')
      .insert({
        user_id: userId,
        tri_plan_id: triPlanId,
        target_race_distance: preferences.targetRaceDistance,
        target_race_date: preferences.targetRaceDate,
        weeks_total: result.weeks.length,
      })
      .select()
      .single();
    if (runPlanError) throw runPlanError;

    const { data: cyclingPlanRow, error: cyclingPlanError } = await db
      .from('cycling_plans')
      .insert({
        user_id: userId,
        tri_plan_id: triPlanId,
        target_event: preferences.targetRaceDistance,
        target_event_date: preferences.targetRaceDate,
        weeks_total: result.weeks.length,
      })
      .select()
      .single();
    if (cyclingPlanError) throw cyclingPlanError;

    const { data: swimPlanRow, error: swimPlanError } = await db
      .from('swim_plans')
      .insert({
        user_id: userId,
        tri_plan_id: triPlanId,
        target_event: preferences.targetRaceDistance,
        target_event_date: preferences.targetRaceDate,
        weeks_total: result.weeks.length,
      })
      .select()
      .single();
    if (swimPlanError) throw swimPlanError;

    const [runWorkoutsRes, cyclingWorkoutsRes, swimWorkoutsRes] = await Promise.all([
      db.from('run_workouts').insert(
        result.runWorkouts.map((w) => ({
          plan_id: runPlanRow.id,
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
      ),
      db.from('cycling_workouts').insert(
        result.cyclingWorkouts.map((w) => ({
          plan_id: cyclingPlanRow.id,
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
      ),
      db.from('swim_workouts').insert(
        result.swimWorkouts.map((w) => ({
          plan_id: swimPlanRow.id,
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
      ),
    ]);

    if (runWorkoutsRes.error) throw runWorkoutsRes.error;
    if (cyclingWorkoutsRes.error) throw cyclingWorkoutsRes.error;
    if (swimWorkoutsRes.error) throw swimWorkoutsRes.error;

    return NextResponse.json({ triPlanId, weeksTotal: result.weeks.length }, { status: 201 });
  } catch (err) {
    console.error('[plans/tri] error:', err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
