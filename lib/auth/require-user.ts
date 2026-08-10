import { createSessionClient } from '@/lib/supabase/server-auth';

// Shared "who is calling this route, and are they authenticated" check for
// API routes. Returns the caller's user id, or null if there's no valid
// session — callers should respond with 401 when this returns null.
//
// This is the API-route equivalent of middleware.ts's redirect-to-/login
// behavior: API routes are exempted from that redirect (an unauthenticated
// fetch() shouldn't get silently redirected to an HTML page), so each route
// checks auth itself and returns a plain 401 JSON response instead.
export async function requireUserId(): Promise<string | null> {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}
