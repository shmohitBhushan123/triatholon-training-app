import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { generateRunPlanRequestSchema } from '@/lib/schemas/plan-request-run';
import { createRunPlan } from '@/services/plan-onboarding/run';

// POST /api/plans/run
// Onboarding submission endpoint for a standalone run plan.
// This handler only does HTTP concerns (auth, parsing, validation, response
// shaping) — the actual derive/persist/generate/persist sequence lives in
// services/plan-onboarding/run.ts, and the raw Supabase calls live in
// lib/plans/run-plans.ts.
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
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const db = createServerClient();

  try {
    const result = await createRunPlan(db, userId, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[plans/run] error:', err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
