import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase/server';
import { getCurrentPlanRef, getTriSubPlanIds } from './current-plan';
import { mockSelectDb, USER_ID } from '@/lib/test-utils/mock-supabase';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCurrentPlanRef', () => {
  it('returns null when the user has no plans at all', async () => {
    mockSelectDb();

    const ref = await getCurrentPlanRef(createServerClient(), USER_ID);
    expect(ref).toBeNull();
  });

  it('returns the only plan found when just one sport has a row', async () => {
    mockSelectDb({
      run_plans: {
        data: { id: 'run-1', created_at: '2026-08-01T00:00:00Z', weeks_total: 16 },
        error: null,
      },
    });

    const ref = await getCurrentPlanRef(createServerClient(), USER_ID);
    expect(ref).toEqual({
      type: 'run',
      planId: 'run-1',
      createdAt: '2026-08-01T00:00:00Z',
      weeksTotal: 16,
    });
  });

  it('picks whichever plan was created most recently across sports', async () => {
    mockSelectDb({
      run_plans: {
        data: { id: 'run-1', created_at: '2026-08-01T00:00:00Z', weeks_total: 16 },
        error: null,
      },
      cycling_plans: {
        data: { id: 'cycling-1', created_at: '2026-08-05T00:00:00Z', weeks_total: 12 },
        error: null,
      },
    });

    const ref = await getCurrentPlanRef(createServerClient(), USER_ID);
    expect(ref?.type).toBe('cycling');
    expect(ref?.planId).toBe('cycling-1');
  });
});

describe('getTriSubPlanIds', () => {
  it('returns the run/cycling/swim sub-plan ids for a tri plan', async () => {
    mockSelectDb({
      run_plans: { data: { id: 'run-sub-1' }, error: null },
      cycling_plans: { data: { id: 'cycling-sub-1' }, error: null },
      swim_plans: { data: { id: 'swim-sub-1' }, error: null },
    });

    const ids = await getTriSubPlanIds(createServerClient(), 'tri-1');
    expect(ids).toEqual({
      runPlanId: 'run-sub-1',
      cyclingPlanId: 'cycling-sub-1',
      swimPlanId: 'swim-sub-1',
    });
  });

  it('throws when a sub-plan lookup errors', async () => {
    mockSelectDb({
      run_plans: { data: null, error: new Error('db down') },
    });

    await expect(getTriSubPlanIds(createServerClient(), 'tri-1')).rejects.toThrow('db down');
  });
});
