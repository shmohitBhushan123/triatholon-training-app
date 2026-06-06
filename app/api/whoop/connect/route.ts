import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { buildWhoopAuthUrl } from '@/lib/whoop/auth';

// GET /api/whoop/connect
// Initiates the Whoop OAuth flow. Whoop requires the state parameter to be
// exactly 8 characters — randomBytes(4) produces 4 bytes which hex-encodes to 8 chars.
export async function GET(): Promise<NextResponse> {
  const state = randomBytes(4).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set('whoop_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  const authUrl = buildWhoopAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
