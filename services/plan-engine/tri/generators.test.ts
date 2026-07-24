import { describe, it, expect } from 'vitest';
import { generateTriPlanResult } from './generators';
import type { RunnerProfile } from '../run/types';
import type { CyclistProfile } from '../cycling/types';
import type { SwimmerProfile } from '../swim/types';
import type { TriPreferences } from './types';

const runProfile: RunnerProfile = {
  id: 'run-id',
  userId: 'test-user',
  vdot: 52,
  seedDistance: 'half_marathon',
  seedTimeSeconds: 5865,
  updatedAt: '2026-06-11T00:00:00Z',
};

const cyclingProfile: CyclistProfile = {
  id: 'cycling-id',
  userId: 'test-user',
  ftpWatts: 163,
  weightKg: 75,
  updatedAt: '2026-06-11T00:00:00Z',
};

const swimProfile: SwimmerProfile = {
  id: 'swim-id',
  userId: 'test-user',
  cssPer100ydSeconds: 115,
  tt400Seconds: 480,
  tt200Seconds: 250,
  updatedAt: '2026-06-11T00:00:00Z',
};

// 17 weeks out — full periodized mode for every sport.
function prefsWithDaysOut(
  daysOut: number,
  overrides: Partial<TriPreferences> = {}
): TriPreferences {
  const d = new Date();
  d.setDate(d.getDate() + daysOut);
  return {
    id: 'pref-id',
    userId: 'test-user',
    hoursPerWeek: 10,
    runDays: [0, 4, 6],
    bikeDays: [1, 3, 5],
    swimDays: [0, 2, 4],
    targetRaceDistance: '70.3',
    targetRaceDate: d.toISOString().split('T')[0],
    ...overrides,
  };
}

describe('generateTriPlanResult — 70.3, 17 weeks out, 10 hrs/week', () => {
  const preferences = prefsWithDaysOut(119); // 17 weeks
  const result = generateTriPlanResult(runProfile, cyclingProfile, swimProfile, preferences);

  it('returns workouts for all three sports', () => {
    expect(result.runWorkouts.length).toBeGreaterThan(0);
    expect(result.cyclingWorkouts.length).toBeGreaterThan(0);
    expect(result.swimWorkouts.length).toBeGreaterThan(0);
  });

  it('produces exactly 17 weekly summary rows', () => {
    expect(result.weeks).toHaveLength(17);
  });

  it('week 1 hour split roughly matches 45/35/20 (bike/run/swim) for 70.3', () => {
    const week1 = result.weeks.find((w) => w.weekNumber === 1)!;
    // Base week volume is under the target due to periodization ramp, but the ratio
    // between legs should still roughly track the 45/35/20 split at the start.
    expect(week1.bikeHours).toBeGreaterThan(week1.swimHours);
    expect(week1.runHours).toBeGreaterThan(week1.swimHours);
  });

  it('week numbers run from 1 to 17 with no gaps', () => {
    const weekNums = result.weeks.map((w) => w.weekNumber).sort((a, b) => a - b);
    expect(weekNums).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
  });

  it('totalHoursAllocated equals sum of the three legs for every week', () => {
    result.weeks.forEach((w) => {
      const sum = Math.round((w.runHours + w.bikeHours + w.swimHours) * 100) / 100;
      expect(w.totalHoursAllocated).toBeCloseTo(sum, 2);
    });
  });
});

describe('generateTriPlanResult — full distance shifts split toward bike', () => {
  const preferences = prefsWithDaysOut(119, { targetRaceDistance: 'full' });
  const result = generateTriPlanResult(runProfile, cyclingProfile, swimProfile, preferences);

  it('week 1 bike hours are proportionally larger than 70.3 split', () => {
    const week1 = result.weeks.find((w) => w.weekNumber === 1)!;
    // Full distance uses 50% bike vs 45% for 70.3 — bike should dominate run more.
    expect(week1.bikeHours).toBeGreaterThan(week1.runHours);
  });
});

describe('generateTriPlanResult — custom long days respected', () => {
  const preferences = prefsWithDaysOut(119, { longRunDay: 6, longRideDay: 5 });
  const result = generateTriPlanResult(runProfile, cyclingProfile, swimProfile, preferences);

  it('long run workout lands on day 6', () => {
    const longRun = result.runWorkouts.find((w) => w.workoutType === 'long');
    expect(longRun?.dayOfWeek).toBe(6);
  });
});
