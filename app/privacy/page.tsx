import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — VELORA',
  description: 'Privacy policy for VELORA.',
};

export default function PrivacyPage() {
  const lastUpdated = 'June 2026';

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white">Privacy Policy</h1>
        <p className="mb-12 text-sm text-zinc-500">Last updated: {lastUpdated}</p>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-white">Overview</h2>
          <p className="leading-7 text-zinc-400">
            This is a personal training application built for individual use. It is not a commercial
            product and is not available to the general public. This policy describes how data from
            connected fitness services is handled.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-white">Data Collected</h2>
          <p className="mb-4 leading-7 text-zinc-400">
            The app connects to the following third-party services with your explicit authorization:
          </p>
          <ul className="space-y-2 text-zinc-400">
            <li className="flex gap-2">
              <span className="mt-1 text-zinc-600">—</span>
              <span>
                <strong className="text-zinc-200">Strava</strong> — activity data including runs,
                rides, and swims.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 text-zinc-600">—</span>
              <span>
                <strong className="text-zinc-200">WHOOP</strong> — recovery score, heart rate
                variability, resting heart rate, and sleep data.
              </span>
            </li>
          </ul>
          <p className="mt-4 leading-7 text-zinc-400">
            OAuth access tokens for each service are stored securely in a private database and are
            never exposed to the browser or shared with any third party.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-white">Data Sharing</h2>
          <p className="leading-7 text-zinc-400">
            No data collected by this application is sold, shared, or disclosed to any third party.
            Data is used solely to display training and recovery information to the authenticated
            user.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-white">Data Retention</h2>
          <p className="leading-7 text-zinc-400">
            OAuth tokens are retained only as long as the connection to a service is active. You can
            revoke access at any time from within the connected service&apos;s settings (e.g. the
            Strava or WHOOP app).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-medium text-white">Contact</h2>
          <p className="leading-7 text-zinc-400">
            Questions about this policy can be directed to the app owner via GitHub.
          </p>
        </section>
      </main>
    </div>
  );
}
