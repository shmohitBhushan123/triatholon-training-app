import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { generateTriPlanRequestSchema } from '@/lib/schemas/plan-request-tri';
import { createTriPlan } from '@/services/plan-onboarding/tri';

// POST /api/plans/tri
// Onboarding submission endpoint for a composite triathlon plan.
// This handler only does HTTP concerns (auth, parsing, validation, response
// shaping) — the actual derive/persist/generate/persist sequence lives in
// services/plan-onboarding/tri.ts, and the raw Supabase calls live in
// lib/plans/{run,cycling,swim,tri}-plans.ts.
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
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const db = createServerClient();

  try {
    const result = await createTriPlan(db, userId, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[plans/tri] error:', err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
