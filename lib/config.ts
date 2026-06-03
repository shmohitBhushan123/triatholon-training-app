// lib/config.ts
// Single source of truth for all environment variables.
// Import from here instead of accessing process.env directly throughout the app.
// This throws at startup if a required variable is missing — fail fast at the boundary.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  },
  strava: {
    clientId: requireEnv('STRAVA_CLIENT_ID'),
    clientSecret: requireEnv('STRAVA_CLIENT_SECRET'),
    redirectUri: requireEnv('STRAVA_REDIRECT_URI'),
  },
  whoop: {
    clientId: requireEnv('WHOOP_CLIENT_ID'),
    clientSecret: requireEnv('WHOOP_CLIENT_SECRET'),
    redirectUri: requireEnv('WHOOP_REDIRECT_URI'),
  },
  garmin: {
    email: requireEnv('GARMIN_EMAIL'),
    // Accessed server-side only in API routes — never exposed to the client.
    password: requireEnv('GARMIN_PASSWORD'),
  },
} as const;
