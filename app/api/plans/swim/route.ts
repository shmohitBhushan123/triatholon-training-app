import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { generateSwimPlanRequestSchema } from '@/lib/schemas/plan-request-swim';
import { createSwimPlan } from '@/services/plan-onboarding/swim';

// POST /api/plans/swim
// Onboarding submission endpoint for a standalone swim plan.
// This handler only does HTTP concerns (auth, parsing, validation, response
// shaping) — the actual derive/persist/generate/persist sequence lives in
// services/plan-onboarding/swim.ts, and the raw Supabase calls live in
// lib/plans/swim-plans.ts.
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
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const db = createServerClient();

  try {
    const result = await createSwimPlan(db, userId, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[plans/swim] error:', err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
