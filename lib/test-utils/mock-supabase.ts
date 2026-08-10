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
