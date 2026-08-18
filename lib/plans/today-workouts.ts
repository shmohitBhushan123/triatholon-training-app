import { createServerClient } from '@/lib/supabase/server';
import { getCurrentPlanRef, getTriSubPlanIds, type TriSubPlanIds } from './current-plan';
import { getCurrentWeekNumber, getDayOfWeekIndex } from '@/services/plan-engine';

// Extracted from app/api/workouts/today/route.ts so both the API route and
// Server Components (e.g. the Home page) can fetch "what's scheduled today"
// without the page having to self-fetch its own API route over HTTP.
//
// weekNumber/dayOfWeek come back null when there's no active plan, or the
// plan hasn't started / has already finished — callers should treat that as
// "nothing scheduled" rather than an error.
export interface TodayWorkoutsResult {
  weekNumber: number | null;
  dayOfWeek: number | null;
  workouts: Array<Record<string, unknown> & { sport: 'run' | 'cycling' | 'swim' }>;
}

type WorkoutRow = Record<string, unknown>;
type TaggedWorkoutRow = WorkoutRow & { sport: 'run' | 'cycling' | 'swim' };

// Isolated so this one query can be tested/mocked independently of the
// tri-vs-single-sport branching in getTodayWorkouts — same pattern as
// getCurrentPlanRef/getTriSubPlanIds in current-plan.ts.
async function getTriWorkoutsForDay(
  db: ReturnType<typeof createServerClient>,
  subPlanIds: TriSubPlanIds,
  weekNumber: number,
  dayOfWeek: number
): Promise<TaggedWorkoutRow[]> {
  const [runRes, cyclingRes, swimRes] = await Promise.all([
    db
      .from('run_workouts')
      .select('*')
      .eq('plan_id', subPlanIds.runPlanId)
      .eq('week_number', weekNumber)
      .eq('day_of_week', dayOfWeek),
    db
      .from('cycling_workouts')
      .select('*')
      .eq('plan_id', subPlanIds.cyclingPlanId)
      .eq('week_number', weekNumber)
      .eq('day_of_week', dayOfWeek),
    db
      .from('swim_workouts')
      .select('*')
      .eq('plan_id', subPlanIds.swimPlanId)
      .eq('week_number', weekNumber)
      .eq('day_of_week', dayOfWeek),
  ]);
  if (runRes.error) throw runRes.error;
  if (cyclingRes.error) throw cyclingRes.error;
  if (swimRes.error) throw swimRes.error;

  return [
    ...(runRes.data ?? []).map((w: WorkoutRow) => ({ ...w, sport: 'run' as const })),
    ...(cyclingRes.data ?? []).map((w: WorkoutRow) => ({ ...w, sport: 'cycling' as const })),
    ...(swimRes.data ?? []).map((w: WorkoutRow) => ({ ...w, sport: 'swim' as const })),
  ];
}

// Isolated for the same reason as getTriWorkoutsForDay above.
async function getSingleSportWorkoutsForDay(
  db: ReturnType<typeof createServerClient>,
  sport: 'run' | 'cycling' | 'swim',
  planId: string,
  weekNumber: number,
  dayOfWeek: number
): Promise<TaggedWorkoutRow[]> {
  const workoutTable = `${sport}_workouts`;
  const { data, error } = await db
    .from(workoutTable)
    .select('*')
    .eq('plan_id', planId)
    .eq('week_number', weekNumber)
    .eq('day_of_week', dayOfWeek);
  if (error) throw error;

  return (data ?? []).map((w: WorkoutRow) => ({ ...w, sport }));
}

export async function getTodayWorkouts(
  db: ReturnType<typeof createServerClient>,
  userId: string
): Promise<TodayWorkoutsResult> {
  const ref = await getCurrentPlanRef(db, userId);
  if (!ref) {
    return { weekNumber: null, dayOfWeek: null, workouts: [] };
  }

  const weekNumber = getCurrentWeekNumber(ref.createdAt, ref.weeksTotal);
  if (weekNumber === null) {
    return { weekNumber: null, dayOfWeek: null, workouts: [] };
  }
  const dayOfWeek = getDayOfWeekIndex();

  if (ref.type === 'tri') {
    const subPlanIds = await getTriSubPlanIds(db, ref.planId);
    const workouts = await getTriWorkoutsForDay(db, subPlanIds, weekNumber, dayOfWeek);
    return { weekNumber, dayOfWeek, workouts };
  }

  const workouts = await getSingleSportWorkoutsForDay(
    db,
    ref.type,
    ref.planId,
    weekNumber,
    dayOfWeek
  );
  return { weekNumber, dayOfWeek, workouts };
}
