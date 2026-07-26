import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Session-aware Supabase client for Server Components, Server Actions, and
// Route Handlers. Reads the logged-in user's own session from cookies and
// respects Row Level Security as that specific user.
//
// NOT the same as lib/supabase/server.ts, which uses the service role key to
// bypass RLS entirely (an "admin" connection). Use THIS client whenever you
// need to know "who is the currently logged-in user" or act on their behalf.
// Use the service-role client only for backend jobs that must act outside any
// single user's permissions (e.g. token refresh crons).
export async function createSessionClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component. This can be
          // ignored if middleware.ts is refreshing the session on every request —
          // Server Components can't write cookies themselves, but the request
          // was already refreshed upstream by the middleware.
        }
      },
    },
  });
}
