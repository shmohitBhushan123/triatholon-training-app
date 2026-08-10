import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/test-utils/mock-supabase';
import { createSwimPlan } from './swim';

const USER_ID = 'user-123';

const validInput = {
  profile: { tt400Seconds: 480, tt200Seconds: 220 },
  preferences: {
    trainingDays: [0, 2, 4],
    goalType: 'completion' as const,
    targetEvent: '70.3_swim',
    targetEventDate: '2027-06-01',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createSwimPlan', () => {
  it('derives CSS from the two time trials and returns a planId', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    const result = await createSwimPlan(db, USER_ID, validInput);

    expect(result.planId).toBe('swim_plans-id');
    const profileInsert = calls.find((c) => c.table === 'swimmer_profiles');
    expect(profileInsert?.rows).toMatchObject({ css_per_100yd_seconds: (480 - 220) / 2 });
  });

  it('persists into swimmer_profiles, swim_preferences, swim_plans, and swim_workouts, in that order', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    await createSwimPlan(db, USER_ID, validInput);

    expect(calls.map((c) => c.table)).toEqual([
      'swimmer_profiles',
      'swim_preferences',
      'swim_plans',
      'swim_workouts',
    ]);
  });

  it('propagates a DB error rather than swallowing it', async () => {
    mockDb({ swimmer_profiles: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(createSwimPlan(db, USER_ID, validInput)).rejects.toThrow('db down');
  });
});
