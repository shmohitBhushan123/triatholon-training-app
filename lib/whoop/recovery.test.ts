import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  whoopFetch: vi.fn(),
}));

import { whoopFetch } from './client';
import { getLatestRecovery, WhoopApiError } from './recovery';

const VALID_RECORD = {
  cycle_id: 1,
  sleep_id: 'sleep-1',
  user_id: 1,
  created_at: '2026-08-12T00:00:00Z',
  updated_at: '2026-08-12T00:00:00Z',
  score_state: 'SCORED',
  score: {
    user_calibrating: false,
    recovery_score: 72,
    resting_heart_rate: 47,
    hrv_rmssd_milli: 64,
    spo2_percentage: null,
    skin_temp_celsius: null,
  },
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getLatestRecovery', () => {
  it('returns the most recent record when one exists', async () => {
    vi.mocked(whoopFetch).mockResolvedValue(
      jsonResponse({ records: [VALID_RECORD], next_token: null })
    );

    const result = await getLatestRecovery();

    expect(result).toEqual(VALID_RECORD);
  });

  it('returns null when there are no records yet', async () => {
    vi.mocked(whoopFetch).mockResolvedValue(jsonResponse({ records: [], next_token: null }));

    expect(await getLatestRecovery()).toBeNull();
  });

  it('throws a WhoopApiError carrying the original status when Whoop responds with an error', async () => {
    vi.mocked(whoopFetch).mockResolvedValue(jsonResponse({ message: 'rate limited' }, false, 429));

    await expect(getLatestRecovery()).rejects.toThrow(WhoopApiError);
    await expect(getLatestRecovery()).rejects.toMatchObject({ status: 429 });
  });

  // whoopFetch itself throws when Whoop isn't connected (no stored tokens) —
  // that error should propagate as-is, not get wrapped in a WhoopApiError.
  it('propagates errors thrown by whoopFetch itself (e.g. not connected)', async () => {
    vi.mocked(whoopFetch).mockRejectedValue(new Error('No Whoop tokens found.'));

    await expect(getLatestRecovery()).rejects.toThrow('No Whoop tokens found.');
  });
});
