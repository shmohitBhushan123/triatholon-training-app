import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildStravaAuthUrl, exchangeStravaCode, refreshStravaToken } from './auth';

// ---------------------------------------------------------------------------
// buildStravaAuthUrl
// ---------------------------------------------------------------------------
// Pure function — no network calls. Sets env vars, calls the function, and
// asserts the resulting URL contains the correct query parameters.
// ---------------------------------------------------------------------------

describe('buildStravaAuthUrl', () => {
  beforeEach(() => {
    process.env.STRAVA_CLIENT_ID = '12345';
    process.env.STRAVA_REDIRECT_URI = 'http://localhost:3000/api/strava/callback';
  });

  const cases = [
    {
      name: 'embeds state param in URL',
      state: 'abc123',
    },
    {
      name: 'handles long hex state string',
      state: 'eaedc8b6a62212ea5384ab71d37cbef8',
    },
  ];

  it.each(cases)('$name', ({ state }) => {
    const url = new URL(buildStravaAuthUrl(state));

    expect(url.origin + url.pathname).toBe('https://www.strava.com/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('12345');
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/strava/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('read,activity:read_all');
    expect(url.searchParams.get('state')).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// exchangeStravaCode
// ---------------------------------------------------------------------------
// Mocks global fetch so no real HTTP calls are made. Table-driven across the
// success path, HTTP error paths, and a malformed-response path.
// ---------------------------------------------------------------------------

const validTokenPayload = {
  access_token: 'test_access',
  refresh_token: 'test_refresh',
  expires_at: 9999999999,
  token_type: 'Bearer',
  athlete: { id: 42, firstname: 'Jane', lastname: 'Triathlete' },
};

describe('exchangeStravaCode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const cases = [
    {
      name: 'returns parsed StravaToken on 200',
      fetchOk: true,
      fetchStatus: 200,
      fetchBody: validTokenPayload,
      expectError: false,
    },
    {
      name: 'throws on HTTP 400',
      fetchOk: false,
      fetchStatus: 400,
      fetchBody: 'Bad Request',
      expectError: true,
    },
    {
      name: 'throws on HTTP 500',
      fetchOk: false,
      fetchStatus: 500,
      fetchBody: 'Internal Server Error',
      expectError: true,
    },
    {
      name: 'throws when response shape fails Zod validation',
      fetchOk: true,
      fetchStatus: 200,
      fetchBody: { unexpected: 'shape' },
      expectError: true,
    },
  ];

  it.each(cases)('$name', async ({ fetchOk, fetchStatus, fetchBody, expectError }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: fetchOk,
        status: fetchStatus,
        json: async () => fetchBody,
        text: async () => (typeof fetchBody === 'string' ? fetchBody : JSON.stringify(fetchBody)),
      })
    );

    if (expectError) {
      await expect(exchangeStravaCode('any_code')).rejects.toThrow();
    } else {
      const token = await exchangeStravaCode('any_code');
      expect(token).toMatchObject(validTokenPayload);
    }
  });
});

// ---------------------------------------------------------------------------
// refreshStravaToken
// ---------------------------------------------------------------------------
// Same fetch-mocking pattern as above but for the refresh flow.
// ---------------------------------------------------------------------------

const validRefreshPayload = {
  access_token: 'new_access',
  refresh_token: 'new_refresh',
  expires_at: 9999999999,
};

describe('refreshStravaToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const cases = [
    {
      name: 'returns new token set on 200',
      fetchOk: true,
      fetchStatus: 200,
      fetchBody: validRefreshPayload,
      expectError: false,
    },
    {
      name: 'throws on HTTP 401 (refresh token revoked)',
      fetchOk: false,
      fetchStatus: 401,
      fetchBody: 'Unauthorized',
      expectError: true,
    },
    {
      name: 'throws on HTTP 500',
      fetchOk: false,
      fetchStatus: 500,
      fetchBody: 'Internal Server Error',
      expectError: true,
    },
  ];

  it.each(cases)('$name', async ({ fetchOk, fetchStatus, fetchBody, expectError }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: fetchOk,
        status: fetchStatus,
        json: async () => fetchBody,
        text: async () => (typeof fetchBody === 'string' ? fetchBody : JSON.stringify(fetchBody)),
      })
    );

    if (expectError) {
      await expect(refreshStravaToken('any_refresh_token')).rejects.toThrow();
    } else {
      const result = await refreshStravaToken('any_refresh_token');
      expect(result).toMatchObject(validRefreshPayload);
    }
  });
});
