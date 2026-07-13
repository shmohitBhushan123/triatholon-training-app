import { describe, it, expect } from 'vitest';
import { buildSwimmingWorkoutsForWeek } from './workout-builder';
import type { SwimmerProfile, SwimPreferences } from './types';
import type { WeekSpec } from '../schedule';

// Reference athlete: CSS = 115s/100yd (1:55/100yd), no weight
const profile: SwimmerProfile = {
  id: 'p1',
  userId: 'u1',
  cssPer100ydSeconds: 115,
  tt400Seconds: 480,
  tt200Seconds: 250,
  updatedAt: '2026-07-09T00:00:00Z',
};

const threeDayPrefs: SwimPreferences = {
  id: 'pref1',
  userId: 'u1',
  trainingDays: [0, 2, 4], // Mon, Wed, Fri
  goalType: 'completion',
  targetEvent: '70.3_swim',
  targetEventDate: '2026-09-14',
};

const fiveDayPrefs: SwimPreferences = {
  id: 'pref2',
  userId: 'u1',
  trainingDays: [0, 1, 2, 3, 4], // Mon–Fri
  goalType: 'time_goal',
  targetEvent: '70.3_swim',
  targetEventDate: '2026-09-14',
};

const baseSpec: WeekSpec = { weekNumber: 1, phase: 'base', volumeMinutes: 6000 }; // 6000 yards
const build1Spec: WeekSpec = { weekNumber: 5, phase: 'build1', volumeMinutes: 8000 }; // 8000 yards

describe('buildSwimmingWorkoutsForWeek — 3-day week, base phase', () => {
  const workouts = buildSwimmingWorkoutsForWeek(baseSpec, threeDayPrefs, profile, '');

  it('produces exactly 3 workouts', () => {
    expect(workouts).toHaveLength(3);
  });

  it('workouts are assigned to correct days', () => {
    const days = workouts.map((w) => w.dayOfWeek);
    expect(days).toEqual([0, 2, 4]);
  });

  it('template is aerobic, threshold, aerobic', () => {
    const types = workouts.map((w) => w.workoutType);
    expect(types).toEqual(['aerobic', 'threshold', 'aerobic']);
  });

  it('threshold workout is 20% of weekly yards (1200yd)', () => {
    const threshold = workouts.find((w) => w.workoutType === 'threshold')!;
    expect(threshold.targetDistanceMeters).toBe(Math.round(1200 * 0.9144)); // 1097m
  });

  it('aerobic workouts split remaining yards equally', () => {
    const aerobic = workouts.filter((w) => w.workoutType === 'aerobic');
    // 6000 - 1200 threshold = 4800 yards / 2 = 2400 each
    expect(aerobic[0].targetDistanceMeters).toBe(Math.round(2400 * 0.9144));
    expect(aerobic[1].targetDistanceMeters).toBe(Math.round(2400 * 0.9144));
  });

  it('phase is correctly stamped on each workout', () => {
    workouts.forEach((w) => expect(w.phase).toBe('base'));
  });

  it('weeklyVolumeYards matches spec', () => {
    workouts.forEach((w) => expect(w.weeklyVolumeYards).toBe(6000));
  });

  it('threshold pace range reflects CSS ± 5s', () => {
    const threshold = workouts.find((w) => w.workoutType === 'threshold')!;
    expect(threshold.targetPaceMin).toBe('1:50'); // 115 - 5 = 110s
    expect(threshold.targetPaceMax).toBe('2:00'); // 115 + 5 = 120s
  });

  it('aerobic targetPaceMin is CSS+15 (2:10), max is null', () => {
    const aerobic = workouts.find((w) => w.workoutType === 'aerobic')!;
    expect(aerobic.targetPaceMin).toBe('2:10'); // 115 + 15 = 130s
    expect(aerobic.targetPaceMax).toBeNull();
  });
});

describe('buildSwimmingWorkoutsForWeek — speed demotion in base phase', () => {
  // 5-day template includes speed; base phase should demote it to aerobic
  const workouts = buildSwimmingWorkoutsForWeek(baseSpec, fiveDayPrefs, profile, '');

  it('no speed workouts in base phase (demoted to aerobic)', () => {
    const types = workouts.map((w) => w.workoutType);
    expect(types).not.toContain('speed');
  });
});

describe('buildSwimmingWorkoutsForWeek — 5-day week, build1 phase', () => {
  const workouts = buildSwimmingWorkoutsForWeek(build1Spec, fiveDayPrefs, profile, '');

  it('produces exactly 5 workouts', () => {
    expect(workouts).toHaveLength(5);
  });

  it('template includes speed in build1 phase', () => {
    const types = workouts.map((w) => w.workoutType);
    expect(types).toContain('speed');
  });

  it('speed workout has null paceMin and correct paceMax', () => {
    const speed = workouts.find((w) => w.workoutType === 'speed')!;
    expect(speed.targetPaceMin).toBeNull(); // no lower bound
    expect(speed.targetPaceMax).toBe('1:50'); // CSS - 5 = 110s
  });

  it('speed workout is 10% of weekly yards (800yd)', () => {
    const speed = workouts.find((w) => w.workoutType === 'speed')!;
    expect(speed.targetDistanceMeters).toBe(Math.round(800 * 0.9144));
  });

  it('workouts are sorted by day of week', () => {
    const days = workouts.map((w) => w.dayOfWeek);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });
});
