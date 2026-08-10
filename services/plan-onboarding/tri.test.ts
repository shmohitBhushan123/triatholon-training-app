import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/test-utils/mock-supabase';
import { createTriPlan } from './tri';

const USER_ID = 'user-123';

const validInput = {
  runProfile: { seedDistance: 'half_marathon' as const, seedTimeSeconds: 5865 },
  cyclingProfile: { ftpWatts: 163, weightKg: 75 },
  swimProfile: { tt400Seconds: 480, tt200Seconds: 220 },
  preferences: {
    hoursPerWeek: 10,
    runDays: [0, 4, 6],
    bikeDays: [1, 3, 5],
    swimDays: [0, 2, 4],
    targetRaceDistance: '70.3' as const,
    targetRaceDate: '2027-06-01',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createTriPlan', () => {
  it('returns a triPlanId and weeksTotal, and persists into every sport table plus tri_plan_weeks', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    const result = await createTriPlan(db, USER_ID, validInput);

    expect(result.triPlanId).toBe('tri_plans-id');
    expect(result.weeksTotal).toBeGreaterThan(0);

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

  it('stamps tri_plan_id onto each sport sub-plan insert', async () => {
    const { calls } = mockDb();
    const db = createServerClient();

    await createTriPlan(db, USER_ID, validInput);

    const runPlanInsert = calls.find((c) => c.table === 'run_plans');
    const cyclingPlanInsert = calls.find((c) => c.table === 'cycling_plans');
    const swimPlanInsert = calls.find((c) => c.table === 'swim_plans');

    expect(runPlanInsert?.rows).toMatchObject({ tri_plan_id: 'tri_plans-id' });
    expect(cyclingPlanInsert?.rows).toMatchObject({ tri_plan_id: 'tri_plans-id' });
    expect(swimPlanInsert?.rows).toMatchObject({ tri_plan_id: 'tri_plans-id' });
  });

  it('propagates a DB error rather than swallowing it', async () => {
    mockDb({ runner_profiles: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(createTriPlan(db, USER_ID, validInput)).rejects.toThrow('db down');
  });
});
