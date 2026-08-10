import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/test-utils/mock-supabase';
import { insertTriPreferences, insertTriPlan, insertTriPlanWeeks } from './tri-plans';

const USER_ID = 'user-123';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('insertTriPreferences', () => {
  it('inserts a tri_preferences row and returns typed TriPreferences', async () => {
    mockDb();
    const db = createServerClient();

    const preferences = await insertTriPreferences(db, USER_ID, {
      hoursPerWeek: 10,
      runDays: [0, 4, 6],
      bikeDays: [1, 3, 5],
      swimDays: [0, 2, 4],
      targetRaceDistance: '70.3',
      targetRaceDate: '2027-06-01',
    });

    expect(preferences).toMatchObject({
      id: 'tri_preferences-id',
      userId: USER_ID,
      hoursPerWeek: 10,
      targetRaceDistance: '70.3',
    });
  });

  it('throws when the insert fails', async () => {
    mockDb({ tri_preferences: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(
      insertTriPreferences(db, USER_ID, {
        hoursPerWeek: 10,
        runDays: [0, 4, 6],
        bikeDays: [1, 3, 5],
        swimDays: [0, 2, 4],
        targetRaceDistance: '70.3',
        targetRaceDate: '2027-06-01',
      })
    ).rejects.toThrow('db down');
  });
});

describe('insertTriPlan', () => {
  it('inserts a tri_plans row and returns its id', async () => {
    mockDb();
    const db = createServerClient();

    const plan = await insertTriPlan(db, USER_ID, {
      targetRaceDistance: '70.3',
      targetRaceDate: '2027-06-01',
      weeksTotal: 16,
      hoursPerWeek: 10,
    });

    expect(plan).toEqual({ id: 'tri_plans-id' });
  });
});

describe('insertTriPlanWeeks', () => {
  it('throws when the bulk insert fails', async () => {
    mockDb({ tri_plan_weeks: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(insertTriPlanWeeks(db, 'tri-plan-1', [])).rejects.toThrow('db down');
  });
});
