import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeStravaCode } from '@/lib/strava/auth';
import { createServerClient } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// GET /api/strava/callback
// Strava redirects here after the user authorizes (or denies) your app.
// Query params from Strava: ?code=xxx&scope=read,activity:read_all&state=xxx
// On error: ?error=access_denied&state=xxx
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope') ?? '';
  const error = searchParams.get('error');

  // User clicked "Cancel" on Strava's authorization page
  if (error) {
    return NextResponse.redirect(`${APP_URL}?error=strava_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}?error=strava_invalid_callback`);
  }

  // Verify the state parameter matches what we stored before redirecting.
  // A mismatch means this request didn't originate from our app (CSRF).
  const cookieStore = await cookies();
  const storedState = cookieStore.get('strava_oauth_state')?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${APP_URL}?error=strava_state_mismatch`);
  }

  // Clear the state cookie — it's single-use
  cookieStore.delete('strava_oauth_state');

  const userId = process.env.PERSONAL_USER_ID;
  if (!userId) {
    throw new Error('Missing PERSONAL_USER_ID environment variable');
  }

  try {
    // Exchange the one-time auth code for long-lived access + refresh tokens
    const tokens = await exchangeStravaCode(code);

    const supabase = createServerClient();

    // Upsert: insert tokens if first time connecting, update if reconnecting.
    // onConflict: 'user_id' means if a row for this user already exists, update it.
    const { error: dbError } = await supabase.from('strava_tokens').upsert(
      {
        user_id: userId,
        athlete_id: tokens.athlete.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
        scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (dbError) {
      throw new Error(`Failed to store Strava tokens: ${dbError.message}`);
    }

    // Redirect back to the app with a success signal
    return NextResponse.redirect(`${APP_URL}?connected=strava`);
  } catch (err) {
    console.error('[strava/callback] error:', err);
    return NextResponse.redirect(`${APP_URL}?error=strava_token_exchange`);
  }
}
