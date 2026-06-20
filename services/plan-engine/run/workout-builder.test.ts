import { describe, it, expect } from 'vitest';
import { buildWorkoutsForWeek } from './workout-builder';
import { getPaceConfig } from './vdot';
import type { RunPreferences } from './types';

const fiveDayPrefs: RunPreferences = {
  id: 'x',
  userId: 'x',
  trainingDays: [0, 2, 4, 5, 6], // Mon/Wed/Fri/Sat/Sun
  longRunDay: 6, // Sunday
  goalType: 'completion',
  targetRaceDistance: 'half_marathon',
  targetRaceDate: '2027-01-01',
  targetWeeklyRunMinutes: 180,
};

const baseSpec = { weekNumber: 1, phase: 'base' as const, volumeMinutes: 180 };

describe('buildWorkoutsForWeek — 5-day week, VDOT 46', () => {
  const paces = getPaceConfig(46);
  const workouts = buildWorkoutsForWeek(baseSpec, fiveDayPrefs, paces, '');

  it('produces exactly 5 workouts', () => {
    expect(workouts).toHaveLength(5);
  });

  it('places the long run on longRunDay (6)', () => {
    const longs = workouts.filter((w) => w.workoutType === 'long');
    expect(longs).toHaveLength(1);
    expect(longs[0].dayOfWeek).toBe(6);
  });

  it('includes both a tempo and an interval session', () => {
    const types = workouts.map((w) => w.workoutType);
    expect(types).toContain('tempo');
    expect(types).toContain('interval');
  });

  it('workouts are sorted ascending by dayOfWeek', () => {
    const days = workouts.map((w) => w.dayOfWeek);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it('stamps VDOT 46 easy pace on easy workouts', () => {
    const easy = workouts.filter((w) => w.workoutType === 'easy');
    expect(easy.length).toBeGreaterThan(0);
    expect(easy.every((w) => w.targetPaceMin === '8:31')).toBe(true);
  });

  it('stamps VDOT 46 tempo pace on tempo workouts', () => {
    const tempo = workouts.filter((w) => w.workoutType === 'tempo');
    expect(tempo).toHaveLength(1);
    expect(tempo[0].targetPaceMin).toBe('7:17');
    expect(tempo[0].targetPaceMax).toBeNull();
  });

  it('interval workout has a single targetPaceMin and no targetPaceMax', () => {
    const interval = workouts.filter((w) => w.workoutType === 'interval');
    expect(interval).toHaveLength(1);
    expect(interval[0].targetPaceMin).toBeTruthy();
    expect(interval[0].targetPaceMax).toBeNull();
  });

  it('all workouts carry correct weekNumber, phase, and weeklyVolumeMinutes', () => {
    expect(workouts.every((w) => w.weekNumber === 1)).toBe(true);
    expect(workouts.every((w) => w.phase === 'base')).toBe(true);
    expect(workouts.every((w) => w.weeklyVolumeMinutes === 180)).toBe(true);
  });
});

describe('buildWorkoutsForWeek — interval demotion at VDOT 32 (no I-pace prescribed)', () => {
  const paces = getPaceConfig(32); // interval400m is null
  const workouts = buildWorkoutsForWeek(baseSpec, fiveDayPrefs, paces, '');

  it('produces no interval workouts', () => {
    expect(workouts.filter((w) => w.workoutType === 'interval')).toHaveLength(0);
  });

  it('demotes the interval slot to easy', () => {
    // 5-day template has 2 easy + 1 interval (demoted) = 3 easy, 1 tempo, 1 long
    expect(workouts.filter((w) => w.workoutType === 'easy')).toHaveLength(3);
  });
});

describe('buildWorkoutsForWeek — 3-day week', () => {
  const prefs: RunPreferences = { ...fiveDayPrefs, trainingDays: [1, 3, 6], longRunDay: 6 };
  const paces = getPaceConfig(46);
  const workouts = buildWorkoutsForWeek(baseSpec, prefs, paces, '');

  it('produces exactly 3 workouts', () => {
    expect(workouts).toHaveLength(3);
  });

  it('contains easy, tempo, and long (no interval in 3-day template)', () => {
    const types = new Set(workouts.map((w) => w.workoutType));
    expect(types.has('easy')).toBe(true);
    expect(types.has('tempo')).toBe(true);
    expect(types.has('long')).toBe(true);
    expect(types.has('interval')).toBe(false);
  });
});
