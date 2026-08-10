import { vi } from 'vitest';
import { createSessionClient } from '@/lib/supabase/server-auth';
import { createServerClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Shared Supabase mocking helpers for API route tests.
//
// These only fake the two Supabase client factories — the I/O boundary.
// Route handlers should import the real plan-engine generators (pure,
// deterministic, already covered by 200+ unit tests elsewhere) so tests also
// verify the route's insert payloads match what the generators actually
// produce.
//
// Usage in a route test file:
//
//   vi.mock('@/lib/supabase/server-auth', () => ({ createSessionClient: vi.fn() }));
//   vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));
//
//   import { mockAuthenticated, mockDb, makeRequest } from '@/lib/test-utils/mock-supabase';
//
// The vi.mock calls above must live in the test file itself (vi.mock hoists
// to the top of the file it's called in, so it can't be re-exported from a
// helper module).
// ---------------------------------------------------------------------------

export const USER_ID = 'user-123';

export function mockAuthenticated(userId: string | null) {
  vi.mocked(createSessionClient).mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: userId ? { claims: { sub: userId } } : null,
      }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

// Builds a fake DB client. `.from(table).insert(rows)` is awaitable directly
// (for bulk workout inserts) AND chainable with `.select().single()` (for
// single-row profile/preference/plan inserts) — both patterns are used by
// route handlers depending on the call site.
export function mockDb(overrides: Record<string, { data?: unknown; error?: unknown }> = {}) {
  const calls: Array<{ table: string; rows: unknown }> = [];

  const from = vi.fn((table: string) => {
    const result = overrides[table] ?? {
      data: { id: `${table}-id`, updated_at: '2026-01-01T00:00:00Z' },
      error: null,
    };

    return {
      insert: vi.fn((rows: unknown) => {
        calls.push({ table, rows });
        return {
          select: () => ({
            single: () => Promise.resolve(result),
          }),
          then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject),
        };
      }),
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(createServerClient).mockReturnValue({ from } as any);
  return { calls };
}

export function makeRequest(body: unknown) {
  return { json: () => Promise.resolve(body) } as Request as never;
}

export function makeBadJsonRequest() {
  return { json: () => Promise.reject(new Error('bad json')) } as Request as never;
}

type SelectResult = { data?: unknown; error?: unknown };

// Builds a fake DB client for read-only (`.select(...)`) query chains —
// `.eq()`, `.is()`, `.order()`, `.limit()` all just return the same builder
// (no real filtering, this is a stub, not a query engine), and `.single()` /
// `.maybeSingle()` / awaiting the builder directly (used for bulk `.select()`
// without `.single()`) all resolve to the configured result for that table.
//
// A table can be given either a single result (returned for every call to
// that table) or an array of results, consumed in call order — needed when a
// route queries the same table more than once with different expected
// results (e.g. a tri plan's getCurrentPlanRef "is there a standalone plan?"
// check on run_plans, followed by getTriSubPlanIds' "find the sub-plan" check
// on the same table). Once the array is down to its last entry, that entry
// keeps being returned for any further calls.
export function mockSelectDb(overrides: Record<string, SelectResult | SelectResult[]> = {}) {
  const calls: Array<{ table: string }> = [];
  const queues: Record<string, SelectResult[]> = {};
  for (const [table, value] of Object.entries(overrides)) {
    queues[table] = Array.isArray(value) ? [...value] : [value];
  }

  function chain(result: SelectResult) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      is: () => builder,
      order: () => builder,
      limit: () => builder,
      single: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    };
    return builder;
  }

  const from = vi.fn((table: string) => {
    calls.push({ table });
    const queue = queues[table];
    const result: SelectResult =
      queue && queue.length > 0
        ? queue.length > 1
          ? queue.shift()!
          : queue[0]
        : { data: null, error: null };
    return chain(result);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(createServerClient).mockReturnValue({ from } as any);
  return { calls };
}
