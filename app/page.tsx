import Link from 'next/link';
import { createSessionClient } from '@/lib/supabase/server-auth';
import { signOut } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';

// Server Component — reads the session directly during render, no client-side
// loading state needed. getClaims() validates the JWT locally; see
// lib/supabase/server-auth.ts for why this client (not the service-role one)
// is used here.
export default async function Home() {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
      <div className="border-border bg-card w-full max-w-sm space-y-4 rounded-xl border p-8 text-center">
        {claims ? (
          <>
            <p className="text-muted-foreground text-sm">Signed in as</p>
            <p className="text-foreground text-lg font-medium">{claims.email}</p>
            <form action={signOut}>
              <Button type="submit" variant="outline" className="w-full">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">You&apos;re not signed in.</p>
            <Button asChild className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
