import { describe, it, expect } from 'vitest';
import { generateSwimPlan } from './plan';
import type { SwimmerProfile, SwimPreferences } from './types';

const mockProfile: SwimmerProfile = {
  id: 'test-id',
  userId: 'test-user',
  cssPer100ydSeconds: 115,
  tt400Seconds: 480,
  tt200Seconds: 250,
  updatedAt: '2026-06-11T00:00:00Z',
};

const mockPreferences: SwimPreferences = {
  id: 'test-pref-id',
  userId: 'test-user',
  trainingDays: [0, 2, 4],
  goalType: 'completion',
  targetEvent: '70.3_swim',
  targetEventDate: '2026-09-14',
};

describe('generateSwimPlan', () => {
  it('returns an array', () => {
    const result = generateSwimPlan(mockProfile, mockPreferences);
    expect(Array.isArray(result)).toBe(true);
  });
});
