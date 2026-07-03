// Unit tests for cycling/workout-builder.ts.
// Tests structural properties of a single generated week — not the same assertion
// across varying inputs, so individual it() blocks are used rather than it.each().
import { describe, it, expect } from 'vitest';
import { buildCyclingWorkoutsForWeek } from './workout-builder';
import type { CyclistProfile, CyclingPreferences } from './types';

const profile: CyclistProfile = {
  id: 'x',
  userId: 'x',
  ftpWatts: 163,
  weightKg: 75,
  updatedAt: '2026-06-22T00:00:00Z',
};

const profileNoWeight: CyclistProfile = { ...profile, weightKg: null };

const fiveDayPrefs: CyclingPreferences = {
  id: 'x',
  userId: 'x',
  trainingDays: [0, 2, 4, 5, 6],
  longRideDay: 6,
  goalType: 'completion',
  targetEvent: 'triathlon_70.3',
  targetEventDate: '2027-01-01',
  targetWeeklyRideMinutes: 180,
};

const baseSpec = { weekNumber: 1, phase: 'base' as const, volumeMinutes: 180 };
const build1Spec = { weekNumber: 5, phase: 'build1' as const, volumeMinutes: 200 };

describe('buildWorkoutsForWeek — 5-day week, base phase', () => {
  const workouts = buildCyclingWorkoutsForWeek(baseSpec, fiveDayPrefs, profile, '');

  it('produces exactly 5 workouts', () => {
    expect(workouts).toHaveLength(5);
  });

  it('long ride is on longRideDay (6)', () => {
    const longs = workouts.filter((w) => w.workoutType === 'long');
    expect(longs).toHaveLength(1);
    expect(longs[0].dayOfWeek).toBe(6);
  });

  it('workouts are sorted ascending by dayOfWeek', () => {
    const days = workouts.map((w) => w.dayOfWeek);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it('base phase demotes threshold → sweet_spot (no threshold workouts)', () => {
    expect(workouts.filter((w) => w.workoutType === 'threshold')).toHaveLength(0);
  });

  it('all workouts have tss > 0', () => {
    expect(workouts.every((w) => w.tss > 0)).toBe(true);
  });

  it('all workouts have cadenceRpm set', () => {
    expect(workouts.every((w) => w.cadenceRpm !== null && w.cadenceRpm! > 0)).toBe(true);
  });

  it('wattsPerKg is set when weightKg is provided', () => {
    expect(workouts.every((w) => w.wattsPerKg !== null)).toBe(true);
  });

  it('all workouts carry correct weekNumber, phase, and weeklyVolumeMinutes', () => {
    expect(workouts.every((w) => w.weekNumber === 1)).toBe(true);
    expect(workouts.every((w) => w.phase === 'base')).toBe(true);
    expect(workouts.every((w) => w.weeklyVolumeMinutes === 180)).toBe(true);
  });

  it('long ride has the highest duration', () => {
    const longDuration = workouts.find((w) => w.workoutType === 'long')!.targetDurationMinutes!;
    const others = workouts
      .filter((w) => w.workoutType !== 'long')
      .map((w) => w.targetDurationMinutes!);
    expect(longDuration).toBeGreaterThanOrEqual(Math.max(...others));
  });
});

describe('buildWorkoutsForWeek — build1 phase (threshold allowed)', () => {
  const workouts = buildCyclingWorkoutsForWeek(build1Spec, fiveDayPrefs, profile, '');

  it('includes a threshold workout in build1 phase', () => {
    expect(workouts.filter((w) => w.workoutType === 'threshold')).toHaveLength(1);
  });
});

describe('buildWorkoutsForWeek — wattsPerKg null when no weight', () => {
  const workouts = buildCyclingWorkoutsForWeek(baseSpec, fiveDayPrefs, profileNoWeight, '');

  it('wattsPerKg is null for all workouts when weightKg not set', () => {
    expect(workouts.every((w) => w.wattsPerKg === null)).toBe(true);
  });
});

describe('buildWorkoutsForWeek — 3-day week', () => {
  const prefs: CyclingPreferences = { ...fiveDayPrefs, trainingDays: [1, 3, 6], longRideDay: 6 };
  const workouts = buildCyclingWorkoutsForWeek(baseSpec, prefs, profile, '');

  it('produces exactly 3 workouts', () => {
    expect(workouts).toHaveLength(3);
  });

  it('contains endurance, sweet_spot, and long (no threshold in 3-day template)', () => {
    const types = new Set(workouts.map((w) => w.workoutType));
    expect(types.has('endurance')).toBe(true);
    expect(types.has('sweet_spot')).toBe(true);
    expect(types.has('long')).toBe(true);
    expect(types.has('threshold')).toBe(false);
  });
});
