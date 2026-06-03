import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using the service role key.
// The service role key bypasses Row Level Security — use this only in API routes
// and server components, never in client components or exposed to the browser.
// Think of it as your "admin" database connection — it has full read/write access and bypasses user-level restrictions.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(url, key, {
    auth: {
      // No session management needed on the server — each request is stateless
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
