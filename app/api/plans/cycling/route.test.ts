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

const validCyclingBody = {
  profile: { ftpWatts: 163, weightKg: 75 },
  preferences: {
    trainingDays: [1, 3, 5, 6],
    longRideDay: 6,
    goalType: 'completion',
    targetEvent: '70.3_bike',
    targetEventDate: '2027-06-01',
    targetWeeklyRideMinutes: 240,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/plans/cycling — auth and validation', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuthenticated(null);
    mockDb();

    const res = await POST(makeRequest(validCyclingBody));
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

describe('POST /api/plans/cycling', () => {
  it('returns 201 with a planId and weeksTotal', async () => {
    mockAuthenticated(USER_ID);
    mockDb();

    const res = await POST(makeRequest(validCyclingBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.planId).toBe('cycling_plans-id');
    expect(body.weeksTotal).toBeGreaterThan(0);
  });

  it('inserts into cyclist_profiles, cycling_preferences, cycling_plans, and cycling_workouts', async () => {
    mockAuthenticated(USER_ID);
    const { calls } = mockDb();

    await POST(makeRequest(validCyclingBody));

    const tables = calls.map((c) => c.table);
    expect(tables).toEqual(
      expect.arrayContaining([
        'cyclist_profiles',
        'cycling_preferences',
        'cycling_plans',
        'cycling_workouts',
      ])
    );
  });

  it('returns 500 when a DB insert fails', async () => {
    mockAuthenticated(USER_ID);
    mockDb({ cyclist_profiles: { data: null, error: new Error('db down') } });

    const res = await POST(makeRequest(validCyclingBody));
    expect(res.status).toBe(500);
  });
});
