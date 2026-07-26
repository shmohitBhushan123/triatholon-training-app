// Integration tests for generateCyclingPlan (public API).
// Tests orchestration layer — mode selection, phase composition, and structural
// invariants — not individual helper functions. Nothing is mocked.
import { describe, it, expect } from 'vitest';
import { generateCyclingPlan } from './plan';
import type { CyclistProfile, CyclingPreferences } from './types';

function weeksFromNow(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split('T')[0];
}

const mockProfile: CyclistProfile = {
  id: 'x',
  userId: 'x',
  ftpWatts: 163,
  weightKg: 75,
  updatedAt: '2026-06-22T00:00:00Z',
};

const mockPreferences: CyclingPreferences = {
  id: 'x',
  userId: 'x',
  trainingDays: [0, 2, 4, 5, 6],
  longRideDay: 6,
  goalType: 'completion',
  targetEvent: 'triathlon_70.3',
  targetEventDate: weeksFromNow(20),
  targetWeeklyRideMinutes: 180,
};

describe('generateCyclingPlan — full plan (20 weeks)', () => {
  const plan = generateCyclingPlan(mockProfile, mockPreferences);

  it('produces one workout per training day per week', () => {
    expect(plan).toHaveLength(20 * mockPreferences.trainingDays.length);
  });

  it('contains all five phases', () => {
    const phases = new Set(plan.map((w) => w.phase));
    for (const p of ['base', 'build1', 'build2', 'race_prep', 'taper']) {
      expect(phases.has(p as never)).toBe(true);
    }
  });

  it('all workouts have completed === false', () => {
    expect(plan.every((w) => w.completed === false)).toBe(true);
  });

  it('all workouts have tss > 0', () => {
    expect(plan.every((w) => w.tss > 0)).toBe(true);
  });

  it('all workouts have power targets set', () => {
    expect(plan.every((w) => w.targetPowerMinWatts !== null)).toBe(true);
  });

  it('triathlon_70.3 uses 2 taper weeks', () => {
    const taperWeeks = [
      ...new Set(plan.filter((w) => w.phase === 'taper').map((w) => w.weekNumber)),
    ];
    expect(taperWeeks).toHaveLength(2);
  });

  it('race week has the lowest weeklyVolumeMinutes', () => {
    const raceWeekNum = Math.max(...plan.map((w) => w.weekNumber));
    const raceWeekVol = plan.find((w) => w.weekNumber === raceWeekNum)!.weeklyVolumeMinutes;
    const maxVol = Math.max(...plan.map((w) => w.weeklyVolumeMinutes));
    expect(raceWeekVol).toBeLessThan(maxVol);
  });
});

describe('generateCyclingPlan — maintenance plan (6 weeks)', () => {
  const plan = generateCyclingPlan(mockProfile, {
    ...mockPreferences,
    targetEventDate: weeksFromNow(6),
  });

  it('produces correct workout count', () => {
    expect(plan).toHaveLength(6 * mockPreferences.trainingDays.length);
  });

  it('has no periodization phases', () => {
    const phases = new Set(plan.map((w) => w.phase));
    for (const p of ['base', 'build1', 'build2', 'race_prep']) {
      expect(phases.has(p as never)).toBe(false);
    }
  });

  it('maintenance weeks have flat weeklyVolumeMinutes', () => {
    const vols = [
      ...new Set(plan.filter((w) => w.phase === 'maintenance').map((w) => w.weeklyVolumeMinutes)),
    ];
    expect(vols).toHaveLength(1);
    expect(vols[0]).toBe(180);
  });
});

describe('generateCyclingPlan — rejection cases', () => {
  it('throws when targetEventDate is null', () => {
    expect(() =>
      generateCyclingPlan(mockProfile, { ...mockPreferences, targetEventDate: null })
    ).toThrow();
  });

  it('throws when event is less than 4 weeks away', () => {
    expect(() =>
      generateCyclingPlan(mockProfile, { ...mockPreferences, targetEventDate: weeksFromNow(2) })
    ).toThrow();
  });
});
