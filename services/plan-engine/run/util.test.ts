import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  formatMinPerMile,
  minutesToMeters,
  deriveIntervalPaceMinPerMile,
} from './util';

describe('parseTimeToMinutes', () => {
  it.each([
    { input: '8:31', expected: 8 + 31 / 60 },
    { input: '0:46', expected: 46 / 60 },
    { input: '1:00', expected: 1 },
    { input: '4:12', expected: 4 + 12 / 60 },
  ])('$input -> ~$expected min', ({ input, expected }) => {
    expect(parseTimeToMinutes(input)).toBeCloseTo(expected, 5);
  });
});

describe('formatMinPerMile', () => {
  it.each([
    { input: 8 + 31 / 60, expected: '8:31' },
    { input: 6 + 45 / 60, expected: '6:45' },
    { input: 10, expected: '10:00' },
    { input: 7 + 17 / 60, expected: '7:17' },
  ])('$input -> $expected', ({ input, expected }) => {
    expect(formatMinPerMile(input)).toBe(expected);
  });
});

describe('minutesToMeters', () => {
  it('60 min at 6:00/mile equals ~10 miles (16,093m)', () => {
    // 60 min / 6 min/mile = 10 miles = 16,093.4m
    expect(minutesToMeters(60, '6:00')).toBeCloseTo(16093, -1);
  });

  it('30 min at 8:00/mile equals ~6,035m', () => {
    const expected = (30 / 8) * 1609.344;
    expect(minutesToMeters(30, '8:00')).toBeCloseTo(expected, 0);
  });

  it('returns 0 for 0 duration', () => {
    expect(minutesToMeters(0, '8:00')).toBe(0);
  });
});

describe('deriveIntervalPaceMinPerMile', () => {
  // interval400m field stores 1000m rep time (see TODO in util.ts).
  // VDOT 46: 1000m in 4:12 -> 238.1 m/min -> 6.759 min/mile -> '6:46'
  it("converts VDOT 46's 1000m time of 4:12 to ~6:46/mile", () => {
    expect(deriveIntervalPaceMinPerMile('4:12')).toBe('6:46');
  });

  it('produces a faster pace for a shorter 1000m time', () => {
    const slow = parseTimeToMinutes(deriveIntervalPaceMinPerMile('4:12'));
    const fast = parseTimeToMinutes(deriveIntervalPaceMinPerMile('3:30'));
    expect(fast).toBeLessThan(slow);
  });
});
