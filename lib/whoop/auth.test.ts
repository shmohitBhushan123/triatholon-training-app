import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildWhoopAuthUrl, exchangeWhoopCode, refreshWhoopToken } from './auth';

// ---------------------------------------------------------------------------
// buildWhoopAuthUrl
// ---------------------------------------------------------------------------
// Pure function — no network calls. Asserts the resulting URL has correct
// query parameters including the 8-char state Whoop requires.
// ---------------------------------------------------------------------------

describe('buildWhoopAuthUrl', () => {
  beforeEach(() => {
    process.env.WHOOP_CLIENT_ID = 'test-client-id';
    process.env.WHOOP_REDIRECT_URI = 'http://localhost:3000/api/whoop/callback';
  });

  const cases = [
    {
      name: 'embeds 8-char hex state in URL',
      state: 'a1b2c3d4',
    },
    {
      name: 'embeds arbitrary state string in URL',
      state: 'f9e8d7c6',
    },
  ];

  it.each(cases)('$name', ({ state }) => {
    const url = new URL(buildWhoopAuthUrl(state));

    expect(url.origin + url.pathname).toBe('https://api.prod.whoop.com/oauth/oauth2/auth');
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/whoop/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe(
      'offline read:recovery read:cycles read:sleep read:profile'
    );
    expect(url.searchParams.get('state')).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// exchangeWhoopCode
// ---------------------------------------------------------------------------
// Mocks global fetch. Table-driven across success, HTTP error, and malformed
// response paths.
// ---------------------------------------------------------------------------

const validWhoopTokenPayload = {
  access_token: 'test_access',
  refresh_token: 'test_refresh',
  expires_in: 3600,
  token_type: 'Bearer',
};

describe('exchangeWhoopCode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const cases = [
    {
      name: 'returns parsed WhoopToken on 200',
      fetchOk: true,
      fetchStatus: 200,
      fetchBody: validWhoopTokenPayload,
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
      await expect(exchangeWhoopCode('any_code')).rejects.toThrow();
    } else {
      const token = await exchangeWhoopCode('any_code');
      expect(token).toMatchObject(validWhoopTokenPayload);
    }
  });
});

// ---------------------------------------------------------------------------
// refreshWhoopToken
// ---------------------------------------------------------------------------
// Whoop returns expires_in (seconds). refreshWhoopToken converts this to
// expires_at (Unix timestamp) before returning. The test asserts the computed
// value falls within the expected range rather than an exact match.
// ---------------------------------------------------------------------------

describe('refreshWhoopToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const cases = [
    {
      name: 'returns new token set with computed expires_at on 200',
      fetchOk: true,
      fetchStatus: 200,
      fetchBody: { access_token: 'new_access', refresh_token: 'new_refresh', expires_in: 3600 },
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
      await expect(refreshWhoopToken('any_refresh_token')).rejects.toThrow();
    } else {
      const before = Math.floor(Date.now() / 1000);
      const result = await refreshWhoopToken('any_refresh_token');
      const after = Math.floor(Date.now() / 1000);

      expect(result.access_token).toBe('new_access');
      expect(result.refresh_token).toBe('new_refresh');
      // expires_at should be approximately now + 3600
      expect(result.expires_at).toBeGreaterThanOrEqual(before + 3600);
      expect(result.expires_at).toBeLessThanOrEqual(after + 3600);
    }
  });
});
