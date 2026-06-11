import { describe, it, expect } from 'vitest';
import { generateTriPlan } from './plan';
import type { RunnerProfile } from '../run/types';
import type { CyclistProfile } from '../cycling/types';
import type { SwimmerProfile } from '../swim/types';
import type { TriPreferences } from './types';

const mockRunProfile: RunnerProfile = {
  id: 'run-id',
  userId: 'test-user',
  vdot: 52,
  seedDistance: 'half_marathon',
  seedTimeSeconds: 5865,
  updatedAt: '2026-06-11T00:00:00Z',
};

const mockCyclingProfile: CyclistProfile = {
  id: 'cycling-id',
  userId: 'test-user',
  ftpWatts: 163,
  weightKg: 75,
  updatedAt: '2026-06-11T00:00:00Z',
};

const mockSwimProfile: SwimmerProfile = {
  id: 'swim-id',
  userId: 'test-user',
  cssPer100ydSeconds: 115,
  tt400Seconds: 480,
  tt200Seconds: 250,
  updatedAt: '2026-06-11T00:00:00Z',
};

const mockPreferences: TriPreferences = {
  id: 'pref-id',
  userId: 'test-user',
  hoursPerWeek: 10,
  runDays: [0, 4, 6],
  bikeDays: [1, 3, 5],
  swimDays: [0, 2, 4],
  targetRaceDistance: '70.3',
  targetRaceDate: '2026-09-14',
};

describe('generateTriPlan', () => {
  it('returns an array', () => {
    const result = generateTriPlan(
      mockRunProfile,
      mockCyclingProfile,
      mockSwimProfile,
      mockPreferences
    );
    expect(Array.isArray(result)).toBe(true);
  });
});
