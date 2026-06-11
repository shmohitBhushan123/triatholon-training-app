import { describe, it, expect } from 'vitest';
import { generateCyclingPlan } from './plan';
import type { CyclistProfile, CyclingPreferences } from './types';

const mockProfile: CyclistProfile = {
  id: 'test-id',
  userId: 'test-user',
  ftpWatts: 163,
  weightKg: 75,
  updatedAt: '2026-06-11T00:00:00Z',
};

const mockPreferences: CyclingPreferences = {
  id: 'test-pref-id',
  userId: 'test-user',
  trainingDays: [1, 3, 5],
  goalType: 'completion',
  targetEvent: '70.3_bike',
  targetEventDate: '2026-09-14',
};

describe('generateCyclingPlan', () => {
  it('returns an array', () => {
    const result = generateCyclingPlan(mockProfile, mockPreferences);
    expect(Array.isArray(result)).toBe(true);
  });
});
