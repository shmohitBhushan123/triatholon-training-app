import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes reachable without being signed in. Prefix-matched against the
// request path. API routes are excluded separately below — redirecting an
// OAuth callback or webhook to /login would break those flows entirely.
const PUBLIC_PATHS = ['/login', '/auth', '/privacy'];

// Refreshes the Supabase session cookie on every matching request, and
// redirects unauthenticated users away from protected pages.
// Server Components can read cookies but cannot write them, so this is the
// only place expired auth tokens get refreshed and re-written to both the
// incoming request (for downstream Server Components in this same request)
// and the outgoing response (for the browser to store going forward).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() validates the JWT signature against the project's published
  // public keys on every call — this is what actually refreshes an expired
  // token. Never use getSession() here; it isn't guaranteed to revalidate.
  const { data } = await supabase.auth.getClaims();

  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api');
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!data?.claims && !isApiRoute && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every route except static assets and image optimization files,
    // where there's no session to refresh anyway.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
