import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { mockSelectDb, USER_ID } from '@/lib/test-utils/mock-supabase';
import { getTodayWorkouts } from './today-workouts';

const NOW = new Date().toISOString();
const LONG_AGO = new Date(Date.now() - 100 * 7 * 24 * 60 * 60 * 1000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getTodayWorkouts', () => {
  it('returns nulls when the user has no plan', async () => {
    mockSelectDb();
    const db = createServerClient();

    const result = await getTodayWorkouts(db, USER_ID);

    expect(result.weekNumber).toBeNull();
    expect(result.workouts).toEqual([]);
  });

  it('returns nulls when the plan has already finished', async () => {
    mockSelectDb({
      run_plans: { data: { id: 'run-1', created_at: LONG_AGO, weeks_total: 1 }, error: null },
      cycling_plans: { data: null, error: null },
      swim_plans: { data: null, error: null },
      tri_plans: { data: null, error: null },
    });
    const db = createServerClient();

    const result = await getTodayWorkouts(db, USER_ID);

    expect(result.weekNumber).toBeNull();
    expect(result.workouts).toEqual([]);
  });

  it("returns today's run workout tagged with sport", async () => {
    mockSelectDb({
      run_plans: { data: { id: 'run-1', created_at: NOW, weeks_total: 16 }, error: null },
      cycling_plans: { data: null, error: null },
      swim_plans: { data: null, error: null },
      tri_plans: { data: null, error: null },
      run_workouts: { data: [{ id: 'w1', week_number: 1, day_of_week: 0 }], error: null },
    });
    const db = createServerClient();

    const result = await getTodayWorkouts(db, USER_ID);

    expect(result.weekNumber).toBe(1);
    expect(result.workouts).toEqual([{ id: 'w1', week_number: 1, day_of_week: 0, sport: 'run' }]);
  });

  it('returns workouts from all three sports for a tri plan (e.g. a brick day)', async () => {
    mockSelectDb({
      run_plans: [
        { data: null, error: null },
        { data: { id: 'run-sub-1' }, error: null },
      ],
      cycling_plans: [
        { data: null, error: null },
        { data: { id: 'cycling-sub-1' }, error: null },
      ],
      swim_plans: [
        { data: null, error: null },
        { data: { id: 'swim-sub-1' }, error: null },
      ],
      tri_plans: { data: { id: 'tri-1', created_at: NOW, weeks_total: 16 }, error: null },
      run_workouts: { data: [{ id: 'rw1' }], error: null },
      cycling_workouts: { data: [{ id: 'cw1' }], error: null },
      swim_workouts: { data: [], error: null },
    });
    const db = createServerClient();

    const result = await getTodayWorkouts(db, USER_ID);

    expect(result.workouts).toEqual([
      { id: 'rw1', sport: 'run' },
      { id: 'cw1', sport: 'cycling' },
    ]);
  });

  it('propagates a DB error to the caller rather than swallowing it', async () => {
    mockSelectDb({
      run_plans: { data: { id: 'run-1', created_at: NOW, weeks_total: 16 }, error: null },
      cycling_plans: { data: null, error: null },
      swim_plans: { data: null, error: null },
      tri_plans: { data: null, error: null },
      run_workouts: { data: null, error: new Error('db down') },
    });
    const db = createServerClient();

    await expect(getTodayWorkouts(db, USER_ID)).rejects.toThrow('db down');
  });
});
