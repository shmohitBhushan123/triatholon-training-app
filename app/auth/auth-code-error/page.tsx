export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
      <div className="border-border bg-card w-full max-w-sm space-y-2 rounded-xl border p-8 text-center">
        <h1 className="text-foreground text-xl font-semibold">Sign-in failed</h1>
        <p className="text-muted-foreground text-sm">
          Something went wrong completing sign-in. Please try again.
        </p>
      </div>
    </div>
  );
}
