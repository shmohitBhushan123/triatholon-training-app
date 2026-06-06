import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeWhoopCode } from '@/lib/whoop/auth';
import { createServerClient } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// GET /api/whoop/callback
// Whoop redirects here after the user authorizes the app.
// Unlike Strava, Whoop tokens use expires_in (seconds from now), not expires_at.
// We compute expires_at = now + expires_in here before storing to keep the
// token refresh logic in client.ts consistent with the Strava pattern.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${APP_URL}?error=whoop_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}?error=whoop_invalid_callback`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get('whoop_oauth_state')?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${APP_URL}?error=whoop_state_mismatch`);
  }

  cookieStore.delete('whoop_oauth_state');

  const userId = process.env.PERSONAL_USER_ID;
  if (!userId) {
    throw new Error('Missing PERSONAL_USER_ID environment variable');
  }

  try {
    const tokens = await exchangeWhoopCode(code);

    // Convert expires_in (seconds) to an absolute Unix timestamp for storage.
    const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

    const supabase = createServerClient();

    const { error: dbError } = await supabase.from('whoop_tokens').upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (dbError) {
      throw new Error(`Failed to store Whoop tokens: ${dbError.message}`);
    }

    return NextResponse.redirect(`${APP_URL}?connected=whoop`);
  } catch (err) {
    console.error('[whoop/callback] error:', err);
    return NextResponse.redirect(`${APP_URL}?error=whoop_token_exchange`);
  }
}
