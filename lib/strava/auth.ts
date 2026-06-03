import { StravaTokenSchema, type StravaToken } from '@/lib/schemas/strava';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

// Permissions we request from the athlete:
// - read: basic profile info
// - activity:read_all: all activities including private ones
const STRAVA_SCOPES = 'read,activity:read_all';

// Builds the URL to send the user to for Strava login and authorization.
// The state parameter is a random value we generate to prevent CSRF attacks —
// we verify it matches when Strava redirects back to our callback.
export function buildStravaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: process.env.STRAVA_REDIRECT_URI!,
    response_type: 'code',
    approval_prompt: 'auto', // only prompt for approval if not already authorized
    scope: STRAVA_SCOPES,
    state,
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

// Exchanges a short-lived auth code (from the callback URL) for long-lived tokens.
// This is a server-to-server call — the client secret never touches the browser.
export async function exchangeStravaCode(code: string): Promise<StravaToken> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava token exchange failed (${response.status}): ${body}`);
  }

  const data: unknown = await response.json();

  // Validate the response shape against our Zod schema.
  // If Strava changes their API response, this will throw immediately rather than
  // silently storing malformed data.
  return StravaTokenSchema.parse(data);
}

// Uses the refresh token to get a new access token when the current one expires.
// Called automatically by the Strava client — the user never sees this happening.
export async function refreshStravaToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
}> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strava token refresh failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  };
}
