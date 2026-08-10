import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server-auth', () => ({
  createSessionClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { POST } from './route';
import {
  USER_ID,
  mockAuthenticated,
  mockDb,
  makeRequest,
  makeBadJsonRequest,
} from '@/lib/test-utils/mock-supabase';

const validSwimBody = {
  profile: { tt400Seconds: 480, tt200Seconds: 220 },
  preferences: {
    trainingDays: [0, 2, 4],
    goalType: 'completion',
    targetEvent: '70.3_swim',
    targetEventDate: '2027-06-01',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/plans/swim — auth and validation', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuthenticated(null);
    mockDb();

    const res = await POST(makeRequest(validSwimBody));
    expect(res.status).toBe(401);
  });

  it('returns 400 for malformed JSON', async () => {
    mockAuthenticated(USER_ID);
    mockDb();

    const res = await POST(makeBadJsonRequest());
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid request shape', async () => {
    mockAuthenticated(USER_ID);
    mockDb();

    const res = await POST(makeRequest({ profile: {}, preferences: {} }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/plans/swim', () => {
  it('derives CSS from the two time trials and returns 201', async () => {
    mockAuthenticated(USER_ID);
    const { calls } = mockDb();

    const res = await POST(makeRequest(validSwimBody));

    expect(res.status).toBe(201);

    const profileInsert = calls.find((c) => c.table === 'swimmer_profiles');
    expect(profileInsert?.rows).toMatchObject({ css_per_100yd_seconds: (480 - 220) / 2 });
  });

  it('inserts into swimmer_profiles, swim_preferences, swim_plans, and swim_workouts', async () => {
    mockAuthenticated(USER_ID);
    const { calls } = mockDb();

    await POST(makeRequest(validSwimBody));

    const tables = calls.map((c) => c.table);
    expect(tables).toEqual(
      expect.arrayContaining([
        'swimmer_profiles',
        'swim_preferences',
        'swim_plans',
        'swim_workouts',
      ])
    );
  });

  it('returns 500 when a DB insert fails', async () => {
    mockAuthenticated(USER_ID);
    mockDb({ swimmer_profiles: { data: null, error: new Error('db down') } });

    const res = await POST(makeRequest(validSwimBody));
    expect(res.status).toBe(500);
  });
});
