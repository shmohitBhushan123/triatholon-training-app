import { WhoopTokenSchema, type WhoopToken } from '@/lib/schemas/whoop';

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

// Permissions requested from the athlete.
// 'offline' grants a refresh token so we can access data without re-prompting.
const WHOOP_SCOPES = 'offline read:recovery read:cycles read:sleep read:profile';

// Builds the URL to redirect the user to for Whoop login and authorization.
// The state parameter must be exactly 8 characters — Whoop enforces this.
// Generate it with: randomBytes(4).toString('hex')
export function buildWhoopAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: process.env.WHOOP_REDIRECT_URI!,
    response_type: 'code',
    scope: WHOOP_SCOPES,
    state,
  });

  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

// Exchanges a one-time auth code (from the callback URL) for access and refresh tokens.
// Whoop's token endpoint uses application/x-www-form-urlencoded, not JSON.
// The response includes expires_in (seconds from now), not expires_at (Unix timestamp).
// Convert to expires_at in the callback route before storing.
export async function exchangeWhoopCode(code: string): Promise<WhoopToken> {
  const body = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID!,
    client_secret: process.env.WHOOP_CLIENT_SECRET!,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.WHOOP_REDIRECT_URI!,
  });

  const response = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Whoop token exchange failed (${response.status}): ${text}`);
  }

  const data: unknown = await response.json();
  return WhoopTokenSchema.parse(data);
}

// Uses the refresh token to get a new access token when the current one expires.
// Returns expires_at (Unix timestamp) computed from expires_in for storage compatibility.
export async function refreshWhoopToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
}> {
  const body = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID!,
    client_secret: process.env.WHOOP_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Whoop token refresh failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
  };
}
