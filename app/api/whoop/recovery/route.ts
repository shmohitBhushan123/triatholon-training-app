import { NextResponse } from 'next/server';
import { whoopFetch } from '@/lib/whoop/client';
import { WhoopRecoverySchema } from '@/lib/schemas/whoop';
import { z } from 'zod';

const WhoopRecoveryListSchema = z.object({
  records: z.array(WhoopRecoverySchema),
  next_token: z.string().nullable(),
});

// GET /api/whoop/recovery
// Fetches the most recent Whoop recovery record.
// Returns recovery score, HRV (hrv_rmssd_milli), and resting heart rate for
// display in the daily workout view and recovery overlay.
export async function GET(): Promise<NextResponse> {
  try {
    const response = await whoopFetch('/v2/recovery?limit=1');

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        { error: `Whoop API error (${response.status}): ${body}` },
        { status: response.status }
      );
    }

    const data: unknown = await response.json();
    const parsed = WhoopRecoveryListSchema.parse(data);
    const record = parsed.records[0] ?? null;

    return NextResponse.json({ recovery: record });
  } catch (err) {
    console.error('[whoop/recovery] error:', err);
    return NextResponse.json({ error: 'Failed to fetch Whoop recovery data' }, { status: 500 });
  }
}
