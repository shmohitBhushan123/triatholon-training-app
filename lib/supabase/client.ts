import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client using the public anon key.
// Safe to use in client components. Row-level security policies enforce access control.
// For server components and API routes, use a server client with service role key when needed.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
