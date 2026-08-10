import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/test-utils/mock-supabase';
import { createCyclingPlan } from './cycling';

const USER_ID = 'user-123';

const validInput = {
  profile: { ftpWatts: 163, weightKg: 75 },
  preferences: {
    trainingDays: [1, 3, 5, 6],
    longRideDay: 6,
    goalType: 'completion' as const,
    targetEvent: '70.3_bike',
    targetEventDate: '2027-06-01',
    targetWeeklyRideMinutes: 240,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createCyclingPlan', () => {
  it('returns a planId and weeksTotal', async () => {
    mockDb();
    const db = createServerClient();

    const result = await createCyclingPlan(db, USER_ID, validInput);

    expect(result.planId).toBe('cycling_plans-id');
    expect(result.weeksTotal).toBeGreaterThan(0);
  });

  it('persists into cyclist_profiles, cycling_preferences, cycling_plans, and cycling_workouts, in that order', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    await createCyclingPlan(db, USER_ID, validInput);

    expect(calls.map((c) => c.table)).toEqual([
      'cyclist_profiles',
      'cycling_preferences',
      'cycling_plans',
      'cycling_workouts',
    ]);
  });

  it('propagates a DB error rather than swallowing it', async () => {
    mockDb({ cyclist_profiles: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(createCyclingPlan(db, USER_ID, validInput)).rejects.toThrow('db down');
  });
});
