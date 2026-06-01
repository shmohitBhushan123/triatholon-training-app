import { NextRequest, NextResponse } from 'next/server';
import { stravaFetch } from '@/lib/strava/client';
import { StravaActivitiesSchema } from '@/lib/schemas/strava';

// GET /api/strava/activities?page=1&per_page=30
// Fetches recent activities from Strava and returns them validated and typed.
// The stravaFetch client handles auth and token refresh automatically.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') ?? '1';
  const perPage = searchParams.get('per_page') ?? '30';

  try {
    const response = await stravaFetch(`/athlete/activities?page=${page}&per_page=${perPage}`);

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json({ error: `Strava API error: ${body}` }, { status: response.status });
    }

    const raw: unknown = await response.json();

    // Validate the response against our Zod schema.
    // If Strava returns unexpected data, this throws with a clear error
    // rather than passing malformed data into the rest of the app.
    const activities = StravaActivitiesSchema.parse(raw);

    return NextResponse.json({ activities });
  } catch (err) {
    console.error('[strava/activities] error:', err);
    return NextResponse.json({ error: 'Failed to fetch Strava activities' }, { status: 500 });
  }
}
