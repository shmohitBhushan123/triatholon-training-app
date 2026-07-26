import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client for use in Client Components.
// Uses the public anon key — safe to expose to the browser. Row Level Security
// policies enforce access control at the database level regardless.
//
// createBrowserClient internally uses a singleton pattern, so calling this
// multiple times across the app does not create multiple client instances.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
