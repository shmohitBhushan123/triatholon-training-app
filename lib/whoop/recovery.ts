import { z } from 'zod';
import { whoopFetch } from './client';
import { WhoopRecoverySchema, type WhoopRecovery } from '@/lib/schemas/whoop';

const WhoopRecoveryListSchema = z.object({
  records: z.array(WhoopRecoverySchema),
  next_token: z.string().nullable(),
});

// Thrown when Whoop's API itself responds with a non-2xx status (as opposed
// to whoopFetch's own "not connected"/token errors) — carries the original
// status code so callers (the API route) can propagate it instead of
// collapsing everything to a generic 500.
export class WhoopApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'WhoopApiError';
  }
}

// Fetches the most recent Whoop recovery record for the connected athlete.
// Extracted from app/api/whoop/recovery/route.ts so the Home page (a Server
// Component) can call it directly too, without self-fetching this route.
//
// Returns null only when Whoop has no recovery record yet (empty `records`).
// If Whoop isn't connected at all, whoopFetch itself throws — callers that
// want a graceful "no recovery card" UI (rather than a hard error) should
// catch that themselves; this function doesn't swallow it, since the API
// route still needs to report a real error to API consumers.
export async function getLatestRecovery(): Promise<WhoopRecovery | null> {
  const response = await whoopFetch('/v2/recovery?limit=1');

  if (!response.ok) {
    const body = await response.text();
    throw new WhoopApiError(response.status, `Whoop API error (${response.status}): ${body}`);
  }

  const data: unknown = await response.json();
  const parsed = WhoopRecoveryListSchema.parse(data);
  return parsed.records[0] ?? null;
}
