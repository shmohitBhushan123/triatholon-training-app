import { createServerClient } from '@/lib/supabase/server';
import { refreshStravaToken } from '@/lib/strava/auth';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

// Reads the stored tokens from Supabase and returns a valid access token.
// If the access token is expired (or about to expire), it silently refreshes it
// and updates Supabase with the new tokens before returning.
async function getValidAccessToken(): Promise<string> {
  const userId = process.env.PERSONAL_USER_ID;
  if (!userId) {
    throw new Error('Missing PERSONAL_USER_ID environment variable');
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('strava_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('No Strava tokens found. Connect your Strava account first.');
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  // Refresh 5 minutes early to avoid using a token that expires mid-request
  const isExpired = data.expires_at <= nowInSeconds + 300;

  if (!isExpired) {
    return data.access_token as string;
  }

  // Token expired — refresh it silently
  const refreshed = await refreshStravaToken(data.refresh_token as string);

  const { error: updateError } = await supabase
    .from('strava_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to update refreshed Strava tokens: ${updateError.message}`);
  }

  return refreshed.access_token;
}

// Authenticated wrapper around fetch for Strava API calls.
// Use this instead of fetch() directly — it handles auth headers and token refresh automatically.
// Equivalent to an HTTP client middleware in Go.
export async function stravaFetch(path: string, options?: RequestInit): Promise<Response> {
  const accessToken = await getValidAccessToken();

  return fetch(`${STRAVA_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}
