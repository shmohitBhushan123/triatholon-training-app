'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

// Client Component: the actual sign-in trigger needs an onClick handler,
// which only works in the browser — this is why it can't be part of the
// otherwise server-rendered login page itself.
export function GoogleSignInButton() {
  async function handleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <Button onClick={handleSignIn} size="lg" className="w-full">
      Continue with Google
    </Button>
  );
}
