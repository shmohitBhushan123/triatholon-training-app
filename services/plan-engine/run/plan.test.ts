// Integration tests for the generateRunPlan public API.
// These tests exercise the orchestration layer — mode selection (full vs maintenance vs reject),
// phase composition, and structural invariants of the output — not individual helper functions.
// it.each() is intentionally avoided here: each describe block asserts properties of a single
// generated plan, not the same assertion across varying inputs. Unit-level helpers (util.ts,
// schedule.ts, etc.) are tested in their own files where it.each() is appropriate.
import { describe, it, expect } from 'vitest';
import { generateRunPlan } from './plan';
import type { RunnerProfile, RunPreferences } from './types';

// Returns an ISO date string exactly N weeks from today at midnight.
function weeksFromNow(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split('T')[0];
}

const mockProfile: RunnerProfile = {
  id: 'test-id',
  userId: 'test-user',
  vdot: 46, // 1:37:45 half marathon
  seedDistance: 'half_marathon',
  seedTimeSeconds: 5865,
  updatedAt: '2026-06-11T00:00:00Z',
};

// 5 training days: Mon/Wed/Fri/Sat/Sun, long run Sunday.
const basePreferences: RunPreferences = {
  id: 'test-pref-id',
  userId: 'test-user',
  trainingDays: [0, 2, 4, 5, 6],
  longRunDay: 6,
  goalType: 'completion',
  targetRaceDistance: 'half_marathon',
  targetRaceDate: weeksFromNow(20),
  targetWeeklyRunMinutes: 180,
};

describe('generateRunPlan — full plan (>= 10 weeks)', () => {
  const plan = generateRunPlan(mockProfile, basePreferences);

  it('produces one workout per training day per week', () => {
    expect(plan).toHaveLength(20 * basePreferences.trainingDays.length);
  });

  it('contains all five phases', () => {
    const phases = new Set(plan.map((w) => w.phase));
    for (const p of ['base', 'build1', 'build2', 'race_prep', 'taper']) {
      expect(phases.has(p as never)).toBe(true);
    }
  });

  it('places every long run on longRunDay', () => {
    const longRuns = plan.filter((w) => w.workoutType === 'long');
    expect(longRuns.length).toBeGreaterThan(0);
    expect(longRuns.every((w) => w.dayOfWeek === basePreferences.longRunDay)).toBe(true);
  });

  it('stamps VDOT 46 easy pace on easy and long workouts', () => {
    const easyAndLong = plan.filter((w) => w.workoutType === 'easy' || w.workoutType === 'long');
    expect(easyAndLong.every((w) => w.targetPaceMin === '8:31')).toBe(true);
  });

  it('week 1 volume equals targetWeeklyRunMinutes', () => {
    expect(plan.find((w) => w.weekNumber === 1)!.weeklyVolumeMinutes).toBe(180);
  });

  it('week 2 volume is 10% higher than week 1', () => {
    expect(plan.find((w) => w.weekNumber === 2)!.weeklyVolumeMinutes).toBe(Math.round(180 * 1.1));
  });

  it('week 4 is a cutback (lower volume than week 3)', () => {
    const vol = (wk: number) => plan.find((w) => w.weekNumber === wk)!.weeklyVolumeMinutes;
    expect(vol(4)).toBeLessThan(vol(3));
  });

  it('race week has lower volume than peak', () => {
    const byWeek = new Map<number, number>();
    for (const w of plan) byWeek.set(w.weekNumber, w.weeklyVolumeMinutes);
    const peak = Math.max(...byWeek.values());
    expect(byWeek.get(20)!).toBeLessThan(peak);
  });

  it('no two consecutive days in a week are both quality sessions', () => {
    const weeks = [...new Set(plan.map((w) => w.weekNumber))];
    for (const wn of weeks) {
      const week = plan
        .filter((w) => w.weekNumber === wn)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      for (let i = 0; i < week.length - 1; i++) {
        const isQuality = (t: string) => t === 'tempo' || t === 'interval';
        if (week[i + 1].dayOfWeek === week[i].dayOfWeek + 1) {
          expect(isQuality(week[i].workoutType) && isQuality(week[i + 1].workoutType)).toBe(false);
        }
      }
    }
  });
});

describe('generateRunPlan — maintenance plan (4-9 weeks)', () => {
  const plan = generateRunPlan(mockProfile, {
    ...basePreferences,
    targetRaceDate: weeksFromNow(6),
  });

  it('produces one workout per training day per week', () => {
    expect(plan).toHaveLength(6 * basePreferences.trainingDays.length);
  });

  it('contains only maintenance and taper phases', () => {
    const phases = new Set(plan.map((w) => w.phase));
    for (const p of ['base', 'build1', 'build2', 'race_prep']) {
      expect(phases.has(p as never)).toBe(false);
    }
    expect(phases.has('maintenance')).toBe(true);
    expect(phases.has('taper')).toBe(true);
  });

  it('maintenance weeks have flat volume equal to targetWeeklyRunMinutes', () => {
    const vols = [
      ...new Set(plan.filter((w) => w.phase === 'maintenance').map((w) => w.weeklyVolumeMinutes)),
    ];
    expect(vols).toHaveLength(1);
    expect(vols[0]).toBe(180);
  });

  it('race week (week 6) has the lowest volume', () => {
    const byWeek = new Map<number, number>();
    for (const w of plan) byWeek.set(w.weekNumber, w.weeklyVolumeMinutes);
    const min = Math.min(...byWeek.values());
    expect(byWeek.get(6)).toBe(min);
  });
});

describe('generateRunPlan — rejection', () => {
  it('throws when race date is fewer than 4 weeks away', () => {
    const prefs = { ...basePreferences, targetRaceDate: weeksFromNow(2) };
    expect(() => generateRunPlan(mockProfile, prefs)).toThrow('too soon');
  });

  it('throws when targetRaceDate is null', () => {
    const prefs = { ...basePreferences, targetRaceDate: null };
    expect(() => generateRunPlan(mockProfile, prefs)).toThrow('targetRaceDate is required');
  });
});
