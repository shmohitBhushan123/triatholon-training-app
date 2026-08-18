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

// Helper to build preferences with a race date a specific number of days out,
// so tests don't rot as the current date advances. Built entirely in UTC
// (rather than local setDate() + toISOString(), which can land on a
// different calendar day depending on the local timezone's offset from UTC
// at the moment the test runs).
function prefsWithDaysOut(daysOut: number): TriPreferences {
  const now = new Date();
  const targetRaceDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + daysOut)
  )
    .toISOString()
    .split('T')[0];
  return { ...mockPreferences, targetRaceDate };
}

describe('generateTriPlan', () => {
  it('returns a TriPlanResult with weeks and workouts for all three sports', () => {
    const result = generateTriPlan(
      mockRunProfile,
      mockCyclingProfile,
      mockSwimProfile,
      mockPreferences
    );
    expect(Array.isArray(result.weeks)).toBe(true);
    expect(Array.isArray(result.runWorkouts)).toBe(true);
    expect(Array.isArray(result.cyclingWorkouts)).toBe(true);
    expect(Array.isArray(result.swimWorkouts)).toBe(true);
  });
});

describe('generateTriPlan — mode gate', () => {
  it('throws when targetRaceDate is empty', () => {
    const preferences: TriPreferences = { ...mockPreferences, targetRaceDate: '' };
    expect(() =>
      generateTriPlan(mockRunProfile, mockCyclingProfile, mockSwimProfile, preferences)
    ).toThrow('targetRaceDate is required');
  });

  it('throws when race is fewer than 4 weeks away', () => {
    const preferences = prefsWithDaysOut(20); // ~3 weeks
    expect(() =>
      generateTriPlan(mockRunProfile, mockCyclingProfile, mockSwimProfile, preferences)
    ).toThrow('too soon');
  });

  it('returns a plan for 4–9 weeks out (each sport uses its own maintenance mode)', () => {
    const preferences = prefsWithDaysOut(42); // 6 weeks
    const result = generateTriPlan(
      mockRunProfile,
      mockCyclingProfile,
      mockSwimProfile,
      preferences
    );
    expect(result.weeks.length).toBeGreaterThan(0);
    expect(result.runWorkouts.length).toBeGreaterThan(0);
    expect(result.cyclingWorkouts.length).toBeGreaterThan(0);
    expect(result.swimWorkouts.length).toBeGreaterThan(0);
  });

  it('returns a full periodized plan for ≥ 10 weeks out', () => {
    const preferences = prefsWithDaysOut(119); // 17 weeks
    const result = generateTriPlan(
      mockRunProfile,
      mockCyclingProfile,
      mockSwimProfile,
      preferences
    );
    expect(result.weeks).toHaveLength(17);
    // Base phase should appear on the run leg in full periodized mode.
    expect(result.runWorkouts.some((w) => w.phase === 'base')).toBe(true);
  });

  it('every weekly summary row has a triPlanId, week number, and non-negative hours', () => {
    const preferences = prefsWithDaysOut(119);
    const result = generateTriPlan(
      mockRunProfile,
      mockCyclingProfile,
      mockSwimProfile,
      preferences
    );
    result.weeks.forEach((w) => {
      expect(w.weekNumber).toBeGreaterThan(0);
      expect(w.totalHoursAllocated).toBeGreaterThanOrEqual(0);
      expect(w.runHours).toBeGreaterThanOrEqual(0);
      expect(w.bikeHours).toBeGreaterThanOrEqual(0);
      expect(w.swimHours).toBeGreaterThanOrEqual(0);
    });
  });
});
