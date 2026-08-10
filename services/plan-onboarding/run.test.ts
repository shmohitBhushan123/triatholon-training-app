import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/test-utils/mock-supabase';
import { createRunPlan } from './run';

const USER_ID = 'user-123';

const validInput = {
  profile: { seedDistance: 'half_marathon' as const, seedTimeSeconds: 5865 },
  preferences: {
    trainingDays: [0, 2, 4, 5, 6],
    longRunDay: 6,
    goalType: 'completion' as const,
    targetRaceDistance: 'half_marathon',
    targetRaceDate: '2027-06-01',
    targetWeeklyRunMinutes: 180,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createRunPlan', () => {
  it('returns a planId and weeksTotal', async () => {
    mockDb();
    const db = createServerClient();

    const result = await createRunPlan(db, USER_ID, validInput);

    expect(result.planId).toBe('run_plans-id');
    expect(result.weeksTotal).toBeGreaterThan(0);
  });

  it('persists into runner_profiles, run_preferences, run_plans, and run_workouts, in that order', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    await createRunPlan(db, USER_ID, validInput);

    expect(calls.map((c) => c.table)).toEqual([
      'runner_profiles',
      'run_preferences',
      'run_plans',
      'run_workouts',
    ]);
  });

  it('propagates a DB error rather than swallowing it', async () => {
    mockDb({ runner_profiles: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(createRunPlan(db, USER_ID, validInput)).rejects.toThrow('db down');
  });
});
