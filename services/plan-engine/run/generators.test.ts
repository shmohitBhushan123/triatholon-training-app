import { describe, it, expect } from 'vitest';
import { generateFullRunningPlan, generateMaintenancePlan } from './generators';
import type { RunnerProfile, RunPreferences } from './types';

const mockProfile: RunnerProfile = {
  id: 'x',
  userId: 'x',
  vdot: 46,
  seedDistance: 'half_marathon',
  seedTimeSeconds: 5865,
  updatedAt: '2026-06-11T00:00:00Z',
};

const mockPreferences: RunPreferences = {
  id: 'x',
  userId: 'x',
  trainingDays: [0, 2, 4, 5, 6], // 5 days
  longRunDay: 6,
  goalType: 'completion',
  targetRaceDistance: 'half_marathon',
  targetRaceDate: '2027-01-01',
  targetWeeklyRunMinutes: 180,
};

describe('generateFullPlan', () => {
  const plan = generateFullRunningPlan(20, mockProfile, mockPreferences);

  it('produces one workout per training day per week', () => {
    expect(plan).toHaveLength(20 * mockPreferences.trainingDays.length);
  });

  it('contains all five phases', () => {
    const phases = new Set(plan.map((w) => w.phase));
    for (const p of ['base', 'build1', 'build2', 'race_prep', 'taper']) {
      expect(phases.has(p as never)).toBe(true);
    }
  });

  it('all workouts have a non-empty planId placeholder', () => {
    // planId is '' until persisted — callers set it before DB insertion
    expect(plan.every((w) => w.planId === '')).toBe(true);
  });

  it('all workouts have completed === false', () => {
    expect(plan.every((w) => w.completed === false)).toBe(true);
  });

  it('uses half_marathon taper length of 2 weeks', () => {
    const taperWeeks = [
      ...new Set(plan.filter((w) => w.phase === 'taper').map((w) => w.weekNumber)),
    ];
    expect(taperWeeks).toHaveLength(2);
  });

  it('marathon target produces 3 taper weeks', () => {
    const marathonPlan = generateFullRunningPlan(20, mockProfile, {
      ...mockPreferences,
      targetRaceDistance: 'marathon',
    });
    const taperWeeks = [
      ...new Set(marathonPlan.filter((w) => w.phase === 'taper').map((w) => w.weekNumber)),
    ];
    expect(taperWeeks).toHaveLength(3);
  });
});

describe('generateMaintenancePlan', () => {
  describe('6 weeks to race (2 taper weeks)', () => {
    const plan = generateMaintenancePlan(6, mockProfile, mockPreferences);

    it('produces one workout per training day per week', () => {
      expect(plan).toHaveLength(6 * mockPreferences.trainingDays.length);
    });

    it('has no periodization phases', () => {
      const phases = new Set(plan.map((w) => w.phase));
      for (const p of ['base', 'build1', 'build2', 'race_prep']) {
        expect(phases.has(p as never)).toBe(false);
      }
    });

    it('maintenance weeks have flat volume', () => {
      const vols = [
        ...new Set(plan.filter((w) => w.phase === 'maintenance').map((w) => w.weeklyVolumeMinutes)),
      ];
      expect(vols).toHaveLength(1);
      expect(vols[0]).toBe(180);
    });

    it('has exactly 2 taper weeks', () => {
      const taperWeeks = [
        ...new Set(plan.filter((w) => w.phase === 'taper').map((w) => w.weekNumber)),
      ];
      expect(taperWeeks).toHaveLength(2);
    });
  });

  describe('4 weeks to race (1 taper week)', () => {
    const plan = generateMaintenancePlan(4, mockProfile, mockPreferences);

    it('has exactly 1 taper week', () => {
      const taperWeeks = [
        ...new Set(plan.filter((w) => w.phase === 'taper').map((w) => w.weekNumber)),
      ];
      expect(taperWeeks).toHaveLength(1);
    });

    it('has 3 maintenance weeks', () => {
      const maintWeeks = [
        ...new Set(plan.filter((w) => w.phase === 'maintenance').map((w) => w.weekNumber)),
      ];
      expect(maintWeeks).toHaveLength(3);
    });
  });
});
