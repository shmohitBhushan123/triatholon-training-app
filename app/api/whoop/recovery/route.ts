import { NextResponse } from 'next/server';
import { getLatestRecovery, WhoopApiError } from '@/lib/whoop/recovery';

// GET /api/whoop/recovery
// Fetches the most recent Whoop recovery record.
// Returns recovery score, HRV (hrv_rmssd_milli), and resting heart rate for
// display in the daily workout view and recovery overlay.
//
// The actual fetch/parse logic lives in lib/whoop/recovery.ts so the Home
// page (a Server Component) can call it directly too, without self-fetching
// this route over HTTP.
export async function GET(): Promise<NextResponse> {
  try {
    const recovery = await getLatestRecovery();
    return NextResponse.json({ recovery });
  } catch (err) {
    if (err instanceof WhoopApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[whoop/recovery] error:', err);
    return NextResponse.json({ error: 'Failed to fetch Whoop recovery data' }, { status: 500 });
  }
}
