import { createServerClient } from '@/lib/supabase/server';

export type PlanType = 'run' | 'cycling' | 'swim' | 'tri';

export interface CurrentPlanRef {
  type: PlanType;
  planId: string;
  createdAt: string;
  weeksTotal: number;
}

interface PlanRow {
  id: string;
  created_at: string;
  weeks_total: number;
}

// Determines the user's single "active" plan: whichever plan (of any sport)
// was created most recently. Standalone run/cycling/swim plans (tri_plan_id
// IS NULL) and tri plans are the candidates — sub-plans belonging to a tri
// plan (tri_plan_id IS NOT NULL) are excluded since the tri_plans row already
// represents that plan as a whole.
//
// Assumes one active plan per user at a time — there's no "archived"/"active"
// status column, so "most recently created" is the current plan. Revisit if
// the product ever needs multiple concurrent plans.
export async function getCurrentPlanRef(
  db: ReturnType<typeof createServerClient>,
  userId: string
): Promise<CurrentPlanRef | null> {
  const [runRes, cyclingRes, swimRes, triRes] = await Promise.all([
    db
      .from('run_plans')
      .select('id, created_at, weeks_total')
      .eq('user_id', userId)
      .is('tri_plan_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('cycling_plans')
      .select('id, created_at, weeks_total')
      .eq('user_id', userId)
      .is('tri_plan_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('swim_plans')
      .select('id, created_at, weeks_total')
      .eq('user_id', userId)
      .is('tri_plan_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('tri_plans')
      .select('id, created_at, weeks_total')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const candidates: Array<{ type: PlanType; row: PlanRow | null }> = [
    { type: 'run', row: runRes.data as PlanRow | null },
    { type: 'cycling', row: cyclingRes.data as PlanRow | null },
    { type: 'swim', row: swimRes.data as PlanRow | null },
    { type: 'tri', row: triRes.data as PlanRow | null },
  ];

  const found = candidates.filter((c): c is { type: PlanType; row: PlanRow } => c.row !== null);
  if (found.length === 0) return null;

  found.sort((a, b) => new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime());
  const winner = found[0];

  return {
    type: winner.type,
    planId: winner.row.id,
    createdAt: winner.row.created_at,
    weeksTotal: winner.row.weeks_total,
  };
}

export interface TriSubPlanIds {
  runPlanId: string;
  cyclingPlanId: string;
  swimPlanId: string;
}

// A tri plan's actual sessions live in the run_workouts/cycling_workouts/
// swim_workouts tables, under three sub-plans stamped with tri_plan_id. This
// looks up those three sub-plan ids so callers can query workouts directly.
export async function getTriSubPlanIds(
  db: ReturnType<typeof createServerClient>,
  triPlanId: string
): Promise<TriSubPlanIds> {
  const [runRes, cyclingRes, swimRes] = await Promise.all([
    db.from('run_plans').select('id').eq('tri_plan_id', triPlanId).single(),
    db.from('cycling_plans').select('id').eq('tri_plan_id', triPlanId).single(),
    db.from('swim_plans').select('id').eq('tri_plan_id', triPlanId).single(),
  ]);
  if (runRes.error) throw runRes.error;
  if (cyclingRes.error) throw cyclingRes.error;
  if (swimRes.error) throw swimRes.error;

  return {
    runPlanId: runRes.data.id,
    cyclingPlanId: cyclingRes.data.id,
    swimPlanId: swimRes.data.id,
  };
}
