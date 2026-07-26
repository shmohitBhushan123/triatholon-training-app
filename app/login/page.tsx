import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

// Server Component — no 'use client' needed. The actual OAuth trigger lives
// in GoogleSignInButton, a small Client Component rendered inside this
// otherwise server-rendered page.
export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
      <div className="border-border bg-card w-full max-w-sm space-y-6 rounded-xl border p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-foreground text-2xl font-semibold">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to view your training plan.</p>
        </div>
        <GoogleSignInButton />
      </div>
    </div>
  );
}
