import { describe, it, expect } from 'vitest';
import { generateFullSwimPlan, generateMaintenanceSwimPlan } from './generators';
import type { SwimmerProfile, SwimPreferences } from './types';

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
  trainingDays: [0, 2, 4], // 3 days/week
  goalType: 'completion',
  targetEvent: '70.3_swim',
  targetEventDate: '2026-09-14',
};

describe('generateFullSwimPlan — 17 weeks, 3 days/week', () => {
  const plan = generateFullSwimPlan(17, profile, threeDayPrefs);

  it('produces exactly 17 weeks × 3 workouts = 51 workouts', () => {
    expect(plan).toHaveLength(51);
  });

  it('week numbers run from 1 to 17', () => {
    const weekNums = [...new Set(plan.map((w) => w.weekNumber))].sort((a, b) => a - b);
    expect(weekNums[0]).toBe(1);
    expect(weekNums[weekNums.length - 1]).toBe(17);
  });

  it('last week is taper phase (70.3 -> 2-week taper)', () => {
    const lastWeek = plan.filter((w) => w.weekNumber === 17);
    lastWeek.forEach((w) => expect(w.phase).toBe('taper'));
  });

  it('penultimate week (16) is also taper', () => {
    const week16 = plan.filter((w) => w.weekNumber === 16);
    week16.forEach((w) => expect(w.phase).toBe('taper'));
  });

  it('first week is base phase', () => {
    const week1 = plan.filter((w) => w.weekNumber === 1);
    week1.forEach((w) => expect(w.phase).toBe('base'));
  });

  it('taper race week volume is lower than penultimate taper week', () => {
    const week16Yards = plan.find((w) => w.weekNumber === 16)!.weeklyVolumeYards;
    const week17Yards = plan.find((w) => w.weekNumber === 17)!.weeklyVolumeYards;
    expect(week17Yards).toBeLessThan(week16Yards);
  });

  it('base_building goal type uses 5000yd base volume', () => {
    const bbPrefs: SwimPreferences = { ...threeDayPrefs, goalType: 'base_building' };
    const bbPlan = generateFullSwimPlan(17, profile, bbPrefs);
    expect(bbPlan[0].weeklyVolumeYards).toBe(5000);
  });

  it('time_goal uses 8000yd base volume', () => {
    const tgPrefs: SwimPreferences = { ...threeDayPrefs, goalType: 'time_goal' };
    const tgPlan = generateFullSwimPlan(17, profile, tgPrefs);
    expect(tgPlan[0].weeklyVolumeYards).toBe(8000);
  });
});

describe('generateMaintenanceSwimPlan — 8 weeks, 3 days/week', () => {
  const plan = generateMaintenanceSwimPlan(8, profile, threeDayPrefs);

  it('produces exactly 8 weeks × 3 workouts = 24 workouts', () => {
    expect(plan).toHaveLength(24);
  });

  it('first 6 weeks are maintenance phase', () => {
    const maintenanceWeeks = plan.filter((w) => w.phase === 'maintenance');
    expect(maintenanceWeeks).toHaveLength(6 * 3); // 18 workouts
  });

  it('last 2 weeks are taper phase', () => {
    const taperWeeks = plan.filter((w) => w.phase === 'taper');
    expect(taperWeeks).toHaveLength(2 * 3); // 6 workouts
  });

  it('maintenance weeks all have the same volume (flat)', () => {
    const maintenanceVols = [
      ...new Set(plan.filter((w) => w.phase === 'maintenance').map((w) => w.weeklyVolumeYards)),
    ];
    expect(maintenanceVols).toHaveLength(1);
  });
});
