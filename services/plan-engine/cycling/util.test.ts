// Unit tests for cycling/util.ts.
// Pure function tests — it.each() used throughout because each case is the same
// assertion pattern across varying inputs.
import { describe, it, expect } from 'vitest';
import { calculateTSS, wattsFromPct, getWeeksToEvent } from './util';

const FTP = 163;

describe('calculateTSS', () => {
  it.each([
    // 60 min at 65% FTP (106w): IF=0.650, TSS = 1 * 0.65^2 * 100 = 42.25 → 42
    { durationMinutes: 60, targetWatts: Math.round(0.65 * FTP), ftpWatts: FTP, expected: 42 },
    // 90 min at FTP (163w): IF=1.0, TSS = 1.5 * 1^2 * 100 = 150
    { durationMinutes: 90, targetWatts: FTP, ftpWatts: FTP, expected: 150 },
    // 45 min at 90% FTP: IF=0.9, TSS = 0.75 * 0.81 * 100 = 60.75 → 61
    { durationMinutes: 45, targetWatts: Math.round(0.9 * FTP), ftpWatts: FTP, expected: 61 },
    // 0 min → always 0
    { durationMinutes: 0, targetWatts: FTP, ftpWatts: FTP, expected: 0 },
  ])(
    '$durationMinutes min at $targetWatts w / FTP $ftpWatts → TSS $expected',
    ({ durationMinutes, targetWatts, ftpWatts, expected }) => {
      expect(calculateTSS(durationMinutes, targetWatts, ftpWatts)).toBe(expected);
    }
  );

  it('higher intensity produces higher TSS for equal duration', () => {
    const tssZ2 = calculateTSS(60, Math.round(0.65 * FTP), FTP);
    const tssZ4 = calculateTSS(60, Math.round(0.97 * FTP), FTP);
    expect(tssZ4).toBeGreaterThan(tssZ2);
  });
});

describe('wattsFromPct', () => {
  it.each([
    { pct: 65, expected: Math.round(0.65 * FTP) },
    { pct: 100, expected: FTP },
    { pct: 55, expected: Math.round(0.55 * FTP) },
    { pct: 120, expected: Math.round(1.2 * FTP) },
  ])('$pct% of FTP $expected w', ({ pct, expected }) => {
    expect(wattsFromPct(FTP, pct)).toBe(expected);
  });
});

describe('getWeeksToEvent', () => {
  it('returns 10 for a date exactly 70 days away', () => {
    const d = new Date();
    d.setDate(d.getDate() + 70);
    expect(getWeeksToEvent(d.toISOString().split('T')[0])).toBe(10);
  });

  it('returns 0 for today (never negative)', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getWeeksToEvent(today)).toBe(0);
  });

  it('returns a larger value for a further date', () => {
    const near = new Date();
    near.setDate(near.getDate() + 70);
    const far = new Date();
    far.setDate(far.getDate() + 140);
    expect(getWeeksToEvent(far.toISOString().split('T')[0])).toBeGreaterThan(
      getWeeksToEvent(near.toISOString().split('T')[0])
    );
  });
});
