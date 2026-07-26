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

const validRunBody = {
  profile: { seedDistance: 'half_marathon', seedTimeSeconds: 5865 },
  preferences: {
    trainingDays: [0, 2, 4, 5, 6],
    longRunDay: 6,
    goalType: 'completion',
    targetRaceDistance: 'half_marathon',
    targetRaceDate: '2027-06-01',
    targetWeeklyRunMinutes: 180,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/plans/run — auth and validation', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuthenticated(null);
    mockDb();

    const res = await POST(makeRequest(validRunBody));
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

describe('POST /api/plans/run', () => {
  it('returns 201 with a planId and weeksTotal', async () => {
    mockAuthenticated(USER_ID);
    mockDb();

    const res = await POST(makeRequest(validRunBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.planId).toBe('run_plans-id');
    expect(body.weeksTotal).toBeGreaterThan(0);
  });

  it('inserts into runner_profiles, run_preferences, run_plans, and run_workouts', async () => {
    mockAuthenticated(USER_ID);
    const { calls } = mockDb();

    await POST(makeRequest(validRunBody));

    const tables = calls.map((c) => c.table);
    expect(tables).toEqual(
      expect.arrayContaining(['runner_profiles', 'run_preferences', 'run_plans', 'run_workouts'])
    );
  });

  it('returns 500 when a DB insert fails', async () => {
    mockAuthenticated(USER_ID);
    mockDb({ runner_profiles: { data: null, error: new Error('db down') } });

    const res = await POST(makeRequest(validRunBody));
    expect(res.status).toBe(500);
  });
});
