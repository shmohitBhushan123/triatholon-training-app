import { describe, it, expect } from 'vitest';
import { generateRunPlan } from './plan';
import type { RunnerProfile, RunPreferences } from './types';

const mockProfile: RunnerProfile = {
  id: 'test-id',
  userId: 'test-user',
  vdot: 52,
  seedDistance: 'half_marathon',
  seedTimeSeconds: 5865,
  updatedAt: '2026-06-11T00:00:00Z',
};

const mockPreferences: RunPreferences = {
  id: 'test-pref-id',
  userId: 'test-user',
  trainingDays: [0, 2, 4, 5, 6],
  longRunDay: 6,
  goalType: 'completion',
  targetRaceDistance: 'half_marathon',
  targetRaceDate: '2026-11-01',
};

describe('generateRunPlan', () => {
  it('returns an array', () => {
    const result = generateRunPlan(mockProfile, mockPreferences);
    expect(Array.isArray(result)).toBe(true);
  });
});
