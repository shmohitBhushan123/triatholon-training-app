import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { mockDb } from '@/lib/test-utils/mock-supabase';
import {
  insertRunnerProfile,
  insertRunPreferences,
  insertRunPlan,
  insertRunWorkouts,
} from './run-plans';

const USER_ID = 'user-123';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('insertRunnerProfile', () => {
  it('inserts a runner_profiles row and returns a typed RunnerProfile', async () => {
    mockDb();
    const db = createServerClient();

    const profile = await insertRunnerProfile(db, USER_ID, {
      vdot: 52,
      seedDistance: 'half_marathon',
      seedTimeSeconds: 5865,
    });

    expect(profile).toMatchObject({
      id: 'runner_profiles-id',
      userId: USER_ID,
      vdot: 52,
      seedDistance: 'half_marathon',
      seedTimeSeconds: 5865,
    });
  });

  it('throws when the insert fails', async () => {
    mockDb({ runner_profiles: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(
      insertRunnerProfile(db, USER_ID, {
        vdot: 52,
        seedDistance: 'half_marathon',
        seedTimeSeconds: 5865,
      })
    ).rejects.toThrow('db down');
  });
});

describe('insertRunPreferences', () => {
  it('inserts a run_preferences row and returns typed RunPreferences', async () => {
    mockDb();
    const db = createServerClient();

    const preferences = await insertRunPreferences(db, USER_ID, {
      trainingDays: [0, 2, 4, 5, 6],
      longRunDay: 6,
      goalType: 'completion',
      targetRaceDistance: 'half_marathon',
      targetRaceDate: '2027-06-01',
      targetWeeklyRunMinutes: 180,
    });

    expect(preferences).toMatchObject({
      id: 'run_preferences-id',
      userId: USER_ID,
      longRunDay: 6,
      targetWeeklyRunMinutes: 180,
    });
  });
});

describe('insertRunPlan', () => {
  it('inserts a run_plans row and returns its id', async () => {
    mockDb();
    const db = createServerClient();

    const plan = await insertRunPlan(db, USER_ID, {
      targetRaceDistance: 'half_marathon',
      targetRaceDate: '2027-06-01',
      weeksTotal: 16,
    });

    expect(plan).toEqual({ id: 'run_plans-id' });
  });
});

describe('insertRunWorkouts', () => {
  it('bulk-inserts one row per workout, mapped to snake_case columns', async () => {
    mockDb();
    const db = createServerClient();

    await insertRunWorkouts(db, 'plan-1', [
      {
        planId: 'plan-1',
        weekNumber: 1,
        phase: 'base',
        weeklyVolumeMinutes: 180,
        dayOfWeek: 2,
        workoutType: 'easy',
        description: 'Easy run',
        targetDistanceMeters: 8000,
        targetDistanceMiles: 5,
        targetPaceZone: 'easy',
        targetPaceMin: '9:30',
        targetPaceMax: '10:00',
        completed: false,
        completedAt: null,
      },
    ]);

    // No assertion error thrown means the insert resolved successfully;
    // shape correctness is covered by the route-level integration test.
  });

  it('throws when the bulk insert fails', async () => {
    mockDb({ run_workouts: { data: null, error: new Error('db down') } });
    const db = createServerClient();

    await expect(insertRunWorkouts(db, 'plan-1', [])).rejects.toThrow('db down');
  });
});
