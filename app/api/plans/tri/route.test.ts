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

const validTriBody = {
  runProfile: { seedDistance: 'half_marathon', seedTimeSeconds: 5865 },
  cyclingProfile: { ftpWatts: 163, weightKg: 75 },
  swimProfile: { tt400Seconds: 480, tt200Seconds: 220 },
  preferences: {
    hoursPerWeek: 10,
    runDays: [0, 4, 6],
    bikeDays: [1, 3, 5],
    swimDays: [0, 2, 4],
    targetRaceDistance: '70.3',
    targetRaceDate: '2027-06-01',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/plans/tri — auth and validation', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuthenticated(null);
    mockDb();

    const res = await POST(makeRequest(validTriBody));
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

    const res = await POST(makeRequest({ preferences: {} }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/plans/tri', () => {
  it('returns 201 with a triPlanId and inserts into all sport tables plus tri_plan_weeks', async () => {
    mockAuthenticated(USER_ID);
    const { calls } = mockDb();

    const res = await POST(makeRequest(validTriBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.triPlanId).toBe('tri_plans-id');

    const tables = calls.map((c) => c.table);
    expect(tables).toEqual(
      expect.arrayContaining([
        'runner_profiles',
        'cyclist_profiles',
        'swimmer_profiles',
        'tri_preferences',
        'tri_plans',
        'tri_plan_weeks',
        'run_plans',
        'cycling_plans',
        'swim_plans',
        'run_workouts',
        'cycling_workouts',
        'swim_workouts',
      ])
    );
  });

  it('stamps tri_plan_id onto each sport plan insert', async () => {
    mockAuthenticated(USER_ID);
    const { calls } = mockDb();

    await POST(makeRequest(validTriBody));

    const runPlanInsert = calls.find((c) => c.table === 'run_plans');
    const cyclingPlanInsert = calls.find((c) => c.table === 'cycling_plans');
    const swimPlanInsert = calls.find((c) => c.table === 'swim_plans');

    expect(runPlanInsert?.rows).toMatchObject({ tri_plan_id: 'tri_plans-id' });
    expect(cyclingPlanInsert?.rows).toMatchObject({ tri_plan_id: 'tri_plans-id' });
    expect(swimPlanInsert?.rows).toMatchObject({ tri_plan_id: 'tri_plans-id' });
  });

  it('returns 500 when a DB insert fails', async () => {
    mockAuthenticated(USER_ID);
    mockDb({ runner_profiles: { data: null, error: new Error('db down') } });

    const res = await POST(makeRequest(validTriBody));
    expect(res.status).toBe(500);
  });
});
