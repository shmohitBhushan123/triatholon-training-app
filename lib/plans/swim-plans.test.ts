import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/test-utils/mock-supabase';
import {
  insertSwimmerProfile,
  insertSwimPreferences,
  insertSwimPlan,
  insertSwimWorkouts,
} from './swim-plans';

const USER_ID = 'user-123';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('insertSwimmerProfile', () => {
  it('inserts a swimmer_profiles row and returns a typed SwimmerProfile', async () => {
    mockDb();
    const db = createServerClient();

    const profile = await insertSwimmerProfile(db, USER_ID, {
      cssPer100ydSeconds: 130,
      tt400Seconds: 480,
      tt200Seconds: 220,
    });

    expect(profile).toMatchObject({
      id: 'swimmer_profiles-id',
      userId: USER_ID,
      cssPer100ydSeconds: 130,
    });
  });

  it('throws when the insert fails', async () => {
    mockDb({ swimmer_profiles: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(
      insertSwimmerProfile(db, USER_ID, {
        cssPer100ydSeconds: 130,
        tt400Seconds: 480,
        tt200Seconds: 220,
      })
    ).rejects.toThrow('db down');
  });
});

describe('insertSwimPreferences', () => {
  it('inserts a swim_preferences row and returns typed SwimPreferences', async () => {
    mockDb();
    const db = createServerClient();

    const preferences = await insertSwimPreferences(db, USER_ID, {
      trainingDays: [0, 2, 4],
      goalType: 'completion',
      targetEvent: '70.3_swim',
      targetEventDate: '2027-06-01',
    });

    expect(preferences).toMatchObject({ id: 'swim_preferences-id', userId: USER_ID });
  });
});

describe('insertSwimPlan', () => {
  it('inserts a swim_plans row with no tri_plan_id by default', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    const plan = await insertSwimPlan(db, USER_ID, {
      targetEvent: '70.3_swim',
      targetEventDate: '2027-06-01',
      weeksTotal: 16,
    });

    expect(plan).toEqual({ id: 'swim_plans-id' });
    expect(calls[0].rows).toMatchObject({ tri_plan_id: null });
  });

  it('stamps tri_plan_id when provided', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    await insertSwimPlan(db, USER_ID, {
      targetEvent: '70.3',
      targetEventDate: '2027-06-01',
      weeksTotal: 16,
      triPlanId: 'tri-plan-1',
    });

    expect(calls[0].rows).toMatchObject({ tri_plan_id: 'tri-plan-1' });
  });
});

describe('insertSwimWorkouts', () => {
  it('throws when the bulk insert fails', async () => {
    mockDb({ swim_workouts: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(insertSwimWorkouts(db, 'plan-1', [])).rejects.toThrow('db down');
  });
});
