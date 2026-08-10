import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server-auth', () => ({
  createSessionClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { GET } from './route';
import { USER_ID, mockAuthenticated, mockSelectDb } from '@/lib/test-utils/mock-supabase';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/plans/current — auth', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuthenticated(null);
    mockSelectDb();

    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe('GET /api/plans/current', () => {
  it('returns 404 when the user has no plan', async () => {
    mockAuthenticated(USER_ID);
    mockSelectDb();

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns the run plan and its workouts', async () => {
    mockAuthenticated(USER_ID);
    mockSelectDb({
      run_plans: [
        { data: { id: 'run-1', created_at: '2026-08-01T00:00:00Z', weeks_total: 16 }, error: null },
        {
          data: { id: 'run-1', created_at: '2026-08-01T00:00:00Z', weeks_total: 16 },
          error: null,
        },
      ],
      cycling_plans: { data: null, error: null },
      swim_plans: { data: null, error: null },
      tri_plans: { data: null, error: null },
      run_workouts: { data: [{ id: 'w1', week_number: 1, day_of_week: 0 }], error: null },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.type).toBe('run');
    expect(body.plan.id).toBe('run-1');
    expect(body.workouts).toHaveLength(1);
  });

  it('returns a tri plan with all three sub-sport workout arrays', async () => {
    mockAuthenticated(USER_ID);
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
      tri_plans: [
        { data: { id: 'tri-1', created_at: '2026-08-01T00:00:00Z', weeks_total: 16 }, error: null },
        { data: { id: 'tri-1', created_at: '2026-08-01T00:00:00Z', weeks_total: 16 }, error: null },
      ],
      tri_plan_weeks: { data: [{ week_number: 1 }], error: null },
      run_workouts: { data: [{ id: 'rw1' }], error: null },
      cycling_workouts: { data: [{ id: 'cw1' }], error: null },
      swim_workouts: { data: [{ id: 'sw1' }], error: null },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.type).toBe('tri');
    expect(body.plan.id).toBe('tri-1');
    expect(body.weeks).toHaveLength(1);
    expect(body.runWorkouts).toHaveLength(1);
    expect(body.cyclingWorkouts).toHaveLength(1);
    expect(body.swimWorkouts).toHaveLength(1);
  });

  it('returns 500 when a DB query fails', async () => {
    mockAuthenticated(USER_ID);
    mockSelectDb({
      run_plans: [
        { data: { id: 'run-1', created_at: '2026-08-01T00:00:00Z', weeks_total: 16 }, error: null },
        { data: null, error: new Error('db down') },
      ],
      cycling_plans: { data: null, error: null },
      swim_plans: { data: null, error: null },
      tri_plans: { data: null, error: null },
    });

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
