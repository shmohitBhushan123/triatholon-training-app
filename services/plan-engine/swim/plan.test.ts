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

// Helpers to build a preferences object with a specific event date. Built
// entirely in UTC (rather than local setDate() + toISOString(), which can
// land on a different calendar day depending on the local timezone's offset
// from UTC at the moment the test runs).
function prefsWithDate(daysOut: number): SwimPreferences {
  const now = new Date();
  const targetEventDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + daysOut)
  )
    .toISOString()
    .split('T')[0];
  return {
    id: 'test-pref-id',
    userId: 'test-user',
    trainingDays: [0, 2, 4],
    goalType: 'completion',
    targetEvent: '70.3_swim',
    targetEventDate,
  };
}

describe('generateSwimPlan — mode gate', () => {
  it('throws when targetEventDate is missing', () => {
    const prefs: SwimPreferences = { ...prefsWithDate(100), targetEventDate: null };
    expect(() => generateSwimPlan(mockProfile, prefs)).toThrow('targetEventDate is required');
  });

  it('throws when event is fewer than 4 weeks away', () => {
    expect(() => generateSwimPlan(mockProfile, prefsWithDate(20))).toThrow('too soon');
  });

  it('returns maintenance plan for 4–9 weeks out (e.g. 42 days = 6 weeks)', () => {
    const plan = generateSwimPlan(mockProfile, prefsWithDate(42));
    expect(plan.length).toBeGreaterThan(0);
    const phases = new Set(plan.map((w) => w.phase));
    // Maintenance plan only has 'maintenance' and 'taper' phases.
    expect(phases.has('base')).toBe(false);
    expect(phases.has('maintenance')).toBe(true);
  });

  it('returns full periodized plan for ≥ 10 weeks out (e.g. 84 days = 12 weeks)', () => {
    const plan = generateSwimPlan(mockProfile, prefsWithDate(84));
    expect(plan.length).toBeGreaterThan(0);
    const phases = new Set(plan.map((w) => w.phase));
    expect(phases.has('base')).toBe(true);
  });

  it('returns an array', () => {
    const result = generateSwimPlan(mockProfile, prefsWithDate(119));
    expect(Array.isArray(result)).toBe(true);
  });

  it('all workouts have valid workoutType', () => {
    const plan = generateSwimPlan(mockProfile, prefsWithDate(119));
    const validTypes = new Set(['aerobic', 'threshold', 'speed', 'rest']);
    plan.forEach((w) => expect(validTypes.has(w.workoutType)).toBe(true));
  });

  it('pace values are snapshotted strings (not null) on threshold workouts', () => {
    const plan = generateSwimPlan(mockProfile, prefsWithDate(119));
    const threshold = plan.filter((w) => w.workoutType === 'threshold');
    expect(threshold.length).toBeGreaterThan(0);
    threshold.forEach((w) => {
      expect(w.targetPaceMin).not.toBeNull();
      expect(w.targetPaceMax).not.toBeNull();
    });
  });
});
