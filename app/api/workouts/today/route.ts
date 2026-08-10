import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { getCurrentPlanRef, getTriSubPlanIds } from '@/lib/plans/current-plan';
import { getCurrentWeekNumber, getDayOfWeekIndex } from '@/services/plan-engine';

// GET /api/workouts/today
// Returns whatever workout(s) are scheduled for "today" in the user's active
// plan — the data source for the daily workout card. A tri plan can return
// more than one workout for the same day (e.g. a brick: bike + run).
//
// weekNumber/dayOfWeek come back null when there's no active plan, or the
// plan hasn't started / has already finished — callers should treat that as
// "nothing scheduled" rather than an error.
export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();

  try {
    const ref = await getCurrentPlanRef(db, userId);
    if (!ref) {
      return NextResponse.json({ weekNumber: null, dayOfWeek: null, workouts: [] });
    }

    const weekNumber = getCurrentWeekNumber(ref.createdAt, ref.weeksTotal);
    if (weekNumber === null) {
      return NextResponse.json({ weekNumber: null, dayOfWeek: null, workouts: [] });
    }
    const dayOfWeek = getDayOfWeekIndex();

    if (ref.type === 'tri') {
      const { runPlanId, cyclingPlanId, swimPlanId } = await getTriSubPlanIds(db, ref.planId);

      const [runRes, cyclingRes, swimRes] = await Promise.all([
        db
          .from('run_workouts')
          .select('*')
          .eq('plan_id', runPlanId)
          .eq('week_number', weekNumber)
          .eq('day_of_week', dayOfWeek),
        db
          .from('cycling_workouts')
          .select('*')
          .eq('plan_id', cyclingPlanId)
          .eq('week_number', weekNumber)
          .eq('day_of_week', dayOfWeek),
        db
          .from('swim_workouts')
          .select('*')
          .eq('plan_id', swimPlanId)
          .eq('week_number', weekNumber)
          .eq('day_of_week', dayOfWeek),
      ]);
      if (runRes.error) throw runRes.error;
      if (cyclingRes.error) throw cyclingRes.error;
      if (swimRes.error) throw swimRes.error;

      const workouts = [
        ...(runRes.data ?? []).map((w) => ({ ...w, sport: 'run' })),
        ...(cyclingRes.data ?? []).map((w) => ({ ...w, sport: 'cycling' })),
        ...(swimRes.data ?? []).map((w) => ({ ...w, sport: 'swim' })),
      ];

      return NextResponse.json({ weekNumber, dayOfWeek, workouts });
    }

    const workoutTable = `${ref.type}_workouts`;
    const { data, error } = await db
      .from(workoutTable)
      .select('*')
      .eq('plan_id', ref.planId)
      .eq('week_number', weekNumber)
      .eq('day_of_week', dayOfWeek);
    if (error) throw error;

    const workouts = (data ?? []).map((w) => ({ ...w, sport: ref.type }));

    return NextResponse.json({ weekNumber, dayOfWeek, workouts });
  } catch (err) {
    console.error('[workouts/today] error:', err);
    return NextResponse.json({ error: "Failed to fetch today's workout" }, { status: 500 });
  }
}
