import { createServerClient } from '@/lib/supabase/server';
import { refreshWhoopToken } from '@/lib/whoop/auth';

const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer';

// Reads stored Whoop tokens from Supabase and returns a valid access token.
// Silently refreshes and stores new tokens if the current one is expired or
// about to expire within the next 5 minutes.
async function getValidWhoopAccessToken(): Promise<string> {
  const userId = process.env.PERSONAL_USER_ID;
  if (!userId) {
    throw new Error('Missing PERSONAL_USER_ID environment variable');
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('whoop_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('No Whoop tokens found. Connect your Whoop account first.');
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const isExpired = data.expires_at <= nowInSeconds + 300;

  if (!isExpired) {
    return data.access_token as string;
  }

  const refreshed = await refreshWhoopToken(data.refresh_token as string);

  const { error: updateError } = await supabase
    .from('whoop_tokens')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to update refreshed Whoop tokens: ${updateError.message}`);
  }

  return refreshed.access_token;
}

// Authenticated wrapper around fetch for Whoop API calls.
// Handles token retrieval and refresh automatically.
export async function whoopFetch(path: string, options?: RequestInit): Promise<Response> {
  const accessToken = await getValidWhoopAccessToken();

  return fetch(`${WHOOP_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}
