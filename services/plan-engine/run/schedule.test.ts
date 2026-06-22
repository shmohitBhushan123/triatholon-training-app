import { describe, it, expect } from 'vitest';
import { buildPeriodizedSchedule } from './generators';

describe('buildFullSchedule', () => {
  describe('20 weeks, 2 taper weeks, 180 min base volume', () => {
    const schedule = buildPeriodizedSchedule(20, 2, 180);

    it('returns exactly 20 entries', () => {
      expect(schedule).toHaveLength(20);
    });

    it('week numbers are sequential from 1', () => {
      expect(schedule.map((w) => w.weekNumber)).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 1)
      );
    });

    it('phases appear in the correct order', () => {
      const phases = schedule.map((w) => w.phase);
      const idx = (p: string) => phases.indexOf(p as never);
      expect(idx('base')).toBeLessThan(idx('build1'));
      expect(idx('build1')).toBeLessThan(idx('build2'));
      expect(idx('build2')).toBeLessThan(idx('race_prep'));
      expect(idx('race_prep')).toBeLessThan(idx('taper'));
    });

    it('week 1 volume equals base volume', () => {
      expect(schedule[0].volumeMinutes).toBe(180);
    });

    it('week 2 volume is 10% above week 1', () => {
      expect(schedule[1].volumeMinutes).toBe(Math.round(180 * 1.1));
    });

    it('week 4 (cutback) has lower volume than week 3', () => {
      expect(schedule[3].volumeMinutes).toBeLessThan(schedule[2].volumeMinutes);
    });

    it('last two weeks are taper phase', () => {
      expect(schedule[18].phase).toBe('taper');
      expect(schedule[19].phase).toBe('taper');
    });

    it('race week (last) has the lowest volume of the plan', () => {
      const min = Math.min(...schedule.map((w) => w.volumeMinutes));
      expect(schedule[19].volumeMinutes).toBe(min);
    });

    it('penultimate taper week volume is greater than race week', () => {
      expect(schedule[18].volumeMinutes).toBeGreaterThan(schedule[19].volumeMinutes);
    });
  });

  describe('minimum viable plan (10 weeks, 2 taper weeks)', () => {
    const schedule = buildPeriodizedSchedule(10, 2, 180);

    it('returns exactly 10 entries', () => {
      expect(schedule).toHaveLength(10);
    });

    it('contains at minimum base and taper phases', () => {
      const phases = new Set(schedule.map((w) => w.phase));
      expect(phases.has('base')).toBe(true);
      expect(phases.has('taper')).toBe(true);
    });
  });

  describe('single-week taper (1 taper week)', () => {
    const schedule = buildPeriodizedSchedule(12, 1, 200);

    it('last week is taper', () => {
      expect(schedule[11].phase).toBe('taper');
    });

    it('second-to-last week is not taper', () => {
      expect(schedule[10].phase).not.toBe('taper');
    });
  });
});
