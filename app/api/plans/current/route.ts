import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { getCurrentPlanRef, getTriSubPlanIds } from '@/lib/plans/current-plan';

// GET /api/plans/current
// Returns the user's single active plan (most recently created, across all
// sports) along with every workout in it. For a tri plan, also includes each
// sub-sport's workouts, since a tri plan's actual sessions live in the
// run_workouts/cycling_workouts/swim_workouts tables under three sub-plans.
export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();

  try {
    const ref = await getCurrentPlanRef(db, userId);
    if (!ref) {
      return NextResponse.json({ error: 'No plan found' }, { status: 404 });
    }

    if (ref.type === 'tri') {
      const { data: plan, error: planError } = await db
        .from('tri_plans')
        .select('*')
        .eq('id', ref.planId)
        .single();
      if (planError) throw planError;

      const { data: weeks, error: weeksError } = await db
        .from('tri_plan_weeks')
        .select('*')
        .eq('tri_plan_id', ref.planId)
        .order('week_number', { ascending: true });
      if (weeksError) throw weeksError;

      const { runPlanId, cyclingPlanId, swimPlanId } = await getTriSubPlanIds(db, ref.planId);

      const [runWorkoutsRes, cyclingWorkoutsRes, swimWorkoutsRes] = await Promise.all([
        db
          .from('run_workouts')
          .select('*')
          .eq('plan_id', runPlanId)
          .order('week_number', { ascending: true })
          .order('day_of_week', { ascending: true }),
        db
          .from('cycling_workouts')
          .select('*')
          .eq('plan_id', cyclingPlanId)
          .order('week_number', { ascending: true })
          .order('day_of_week', { ascending: true }),
        db
          .from('swim_workouts')
          .select('*')
          .eq('plan_id', swimPlanId)
          .order('week_number', { ascending: true })
          .order('day_of_week', { ascending: true }),
      ]);
      if (runWorkoutsRes.error) throw runWorkoutsRes.error;
      if (cyclingWorkoutsRes.error) throw cyclingWorkoutsRes.error;
      if (swimWorkoutsRes.error) throw swimWorkoutsRes.error;

      return NextResponse.json({
        type: 'tri',
        plan,
        weeks,
        runWorkouts: runWorkoutsRes.data,
        cyclingWorkouts: cyclingWorkoutsRes.data,
        swimWorkouts: swimWorkoutsRes.data,
      });
    }

    const planTable = `${ref.type}_plans`;
    const workoutTable = `${ref.type}_workouts`;

    const { data: plan, error: planError } = await db
      .from(planTable)
      .select('*')
      .eq('id', ref.planId)
      .single();
    if (planError) throw planError;

    const { data: workouts, error: workoutsError } = await db
      .from(workoutTable)
      .select('*')
      .eq('plan_id', ref.planId)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true });
    if (workoutsError) throw workoutsError;

    return NextResponse.json({ type: ref.type, plan, workouts });
  } catch (err) {
    console.error('[plans/current] error:', err);
    return NextResponse.json({ error: 'Failed to fetch current plan' }, { status: 500 });
  }
}
