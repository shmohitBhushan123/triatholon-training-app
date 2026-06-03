import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stravaFetch } from './client';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
// vi.mock hoists to the top of the file, replacing real modules with fakes
// before the module under test is imported.
// Supabase and the auth helpers are mocked so no network calls are made.
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/strava/auth', () => ({
  refreshStravaToken: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { refreshStravaToken } from '@/lib/strava/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW_SECONDS = Math.floor(Date.now() / 1000);

// Builds a fake Supabase client whose .from().select().eq().single() chain
// resolves with selectResult, and .from().update().eq() resolves with updateResult.
function makeSupabaseMock({
  selectResult,
  updateResult = { error: null },
}: {
  selectResult: { data: unknown; error: unknown };
  updateResult?: { error: unknown };
}) {
  const mockSingle = vi.fn().mockResolvedValue(selectResult);
  const mockSelectEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));

  const mockUpdateEq = vi.fn().mockResolvedValue(updateResult);
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

  return {
    from: vi.fn(() => ({ select: mockSelect, update: mockUpdate })),
  };
}

// ---------------------------------------------------------------------------
// stravaFetch — token validity cases (table-driven)
// ---------------------------------------------------------------------------
// These three cases test the expiry logic inside getValidAccessToken.
// The table varies only the `expires_at` value and what access token we
// expect to see on the outgoing Strava request.
// ---------------------------------------------------------------------------

describe('stravaFetch — token lifecycle', () => {
  beforeEach(() => {
    process.env.PERSONAL_USER_ID = 'test-user-uuid';
    process.env.STRAVA_CLIENT_ID = '12345';
    process.env.STRAVA_CLIENT_SECRET = 'test-secret';

    vi.mocked(refreshStravaToken).mockResolvedValue({
      access_token: 'refreshed-access-token',
      refresh_token: 'new-refresh-token',
      expires_at: NOW_SECONDS + 3600,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    delete process.env.PERSONAL_USER_ID;
  });

  const cases = [
    {
      name: 'uses existing token when it is not expired',
      storedToken: {
        access_token: 'valid-access-token',
        refresh_token: 'stored-refresh-token',
        expires_at: NOW_SECONDS + 3600, // 1 hour from now — clearly valid
      },
      expectedAuthHeader: 'Bearer valid-access-token',
      expectRefreshCalled: false,
    },
    {
      name: 'refreshes and uses new token when already expired',
      storedToken: {
        access_token: 'stale-access-token',
        refresh_token: 'stored-refresh-token',
        expires_at: NOW_SECONDS - 100, // 100s in the past — definitely expired
      },
      expectedAuthHeader: 'Bearer refreshed-access-token',
      expectRefreshCalled: true,
    },
    {
      name: 'refreshes when token is within the 5-minute expiry window',
      storedToken: {
        access_token: 'soon-expiring-token',
        refresh_token: 'stored-refresh-token',
        expires_at: NOW_SECONDS + 100, // 100s from now — within 300s buffer
      },
      expectedAuthHeader: 'Bearer refreshed-access-token',
      expectRefreshCalled: true,
    },
  ];

  it.each(cases)('$name', async ({ storedToken, expectedAuthHeader, expectRefreshCalled }) => {
    vi.mocked(createServerClient).mockReturnValue(
      makeSupabaseMock({
        selectResult: { data: storedToken, error: null },
      }) as unknown as ReturnType<typeof createServerClient>
    );

    const mockStravResponse = new Response(JSON.stringify([]), { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockStravResponse));

    await stravaFetch('/athlete/activities');

    const [calledUrl, calledOptions] = vi.mocked(fetch).mock.calls[0];
    expect(calledUrl).toBe('https://www.strava.com/api/v3/athlete/activities');
    expect((calledOptions?.headers as Record<string, string>)['Authorization']).toBe(
      expectedAuthHeader
    );
    expect(refreshStravaToken).toHaveBeenCalledTimes(expectRefreshCalled ? 1 : 0);
  });
});

// ---------------------------------------------------------------------------
// stravaFetch — error cases (standalone — each has unique mock setup)
// ---------------------------------------------------------------------------

describe('stravaFetch — error cases', () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.PERSONAL_USER_ID;
  });

  it('throws when PERSONAL_USER_ID is not set', async () => {
    delete process.env.PERSONAL_USER_ID;
    await expect(stravaFetch('/athlete')).rejects.toThrow('Missing PERSONAL_USER_ID');
  });

  it('throws when no Strava tokens exist in the database', async () => {
    process.env.PERSONAL_USER_ID = 'test-user-uuid';

    vi.mocked(createServerClient).mockReturnValue(
      makeSupabaseMock({
        selectResult: { data: null, error: { message: 'No rows found' } },
      }) as unknown as ReturnType<typeof createServerClient>
    );

    await expect(stravaFetch('/athlete')).rejects.toThrow('No Strava tokens found');
  });

  it('throws when Supabase fails to store the refreshed token', async () => {
    process.env.PERSONAL_USER_ID = 'test-user-uuid';

    const expiredTokens = {
      access_token: 'old-token',
      refresh_token: 'old-refresh',
      expires_at: NOW_SECONDS - 100,
    };

    vi.mocked(createServerClient).mockReturnValue(
      makeSupabaseMock({
        selectResult: { data: expiredTokens, error: null },
        updateResult: { error: { message: 'DB write failed' } },
      }) as unknown as ReturnType<typeof createServerClient>
    );

    vi.mocked(refreshStravaToken).mockResolvedValue({
      access_token: 'new-token',
      refresh_token: 'new-refresh',
      expires_at: NOW_SECONDS + 3600,
    });

    await expect(stravaFetch('/athlete')).rejects.toThrow(
      'Failed to update refreshed Strava tokens'
    );
  });
});
