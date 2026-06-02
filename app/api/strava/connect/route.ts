import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { buildStravaAuthUrl } from '@/lib/strava/auth';

// GET /api/strava/connect
// Initiates the Strava OAuth flow by redirecting the user to Strava's auth page.
// Before redirecting, generates a random state value and stores it in a cookie
// so we can verify it in the callback — this prevents CSRF attacks.
export async function GET(): Promise<NextResponse> {
  const state = randomBytes(16).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set('strava_oauth_state', state, {
    httpOnly: true, // not accessible from JavaScript — prevents XSS theft
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // sent on top-level navigations, not cross-site requests
    maxAge: 60 * 10, // 10 minutes — enough time to complete the OAuth flow
    path: '/',
  });

  const authUrl = buildStravaAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
