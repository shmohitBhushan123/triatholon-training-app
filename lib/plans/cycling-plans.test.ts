import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/test-utils/mock-supabase';
import {
  insertCyclistProfile,
  insertCyclingPreferences,
  insertCyclingPlan,
  insertCyclingWorkouts,
} from './cycling-plans';

const USER_ID = 'user-123';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('insertCyclistProfile', () => {
  it('inserts a cyclist_profiles row and returns a typed CyclistProfile', async () => {
    mockDb();
    const db = createServerClient();

    const profile = await insertCyclistProfile(db, USER_ID, { ftpWatts: 163, weightKg: 75 });

    expect(profile).toMatchObject({
      id: 'cyclist_profiles-id',
      userId: USER_ID,
      ftpWatts: 163,
      weightKg: 75,
    });
  });

  it('throws when the insert fails', async () => {
    mockDb({ cyclist_profiles: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(
      insertCyclistProfile(db, USER_ID, { ftpWatts: 163, weightKg: 75 })
    ).rejects.toThrow('db down');
  });
});

describe('insertCyclingPreferences', () => {
  it('inserts a cycling_preferences row and returns typed CyclingPreferences', async () => {
    mockDb();
    const db = createServerClient();

    const preferences = await insertCyclingPreferences(db, USER_ID, {
      trainingDays: [1, 3, 5, 6],
      longRideDay: 6,
      goalType: 'completion',
      targetEvent: '70.3_bike',
      targetEventDate: '2027-06-01',
      targetWeeklyRideMinutes: 240,
    });

    expect(preferences).toMatchObject({
      id: 'cycling_preferences-id',
      userId: USER_ID,
      longRideDay: 6,
      targetWeeklyRideMinutes: 240,
    });
  });
});

describe('insertCyclingPlan', () => {
  it('inserts a cycling_plans row with no tri_plan_id by default', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    const plan = await insertCyclingPlan(db, USER_ID, {
      targetEvent: '70.3_bike',
      targetEventDate: '2027-06-01',
      weeksTotal: 16,
    });

    expect(plan).toEqual({ id: 'cycling_plans-id' });
    expect(calls[0].rows).toMatchObject({ tri_plan_id: null });
  });

  it('stamps tri_plan_id when provided', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    await insertCyclingPlan(db, USER_ID, {
      targetEvent: '70.3',
      targetEventDate: '2027-06-01',
      weeksTotal: 16,
      triPlanId: 'tri-plan-1',
    });

    expect(calls[0].rows).toMatchObject({ tri_plan_id: 'tri-plan-1' });
  });
});

describe('insertCyclingWorkouts', () => {
  it('throws when the bulk insert fails', async () => {
    mockDb({ cycling_workouts: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(insertCyclingWorkouts(db, 'plan-1', [])).rejects.toThrow('db down');
  });
});
