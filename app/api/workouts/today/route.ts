import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/require-user';
import { getTodayWorkouts } from '@/lib/plans/today-workouts';

// GET /api/workouts/today
// Returns whatever workout(s) are scheduled for "today" in the user's active
// plan — the data source for the daily workout card. A tri plan can return
// more than one workout for the same day (e.g. a brick: bike + run).
//
// The actual query logic lives in lib/plans/today-workouts.ts so the Home
// page (a Server Component) can call it directly too, without self-fetching
// this route over HTTP.
export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();

  try {
    const result = await getTodayWorkouts(db, userId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[workouts/today] error:', err);
    return NextResponse.json({ error: "Failed to fetch today's workout" }, { status: 500 });
  }
}
