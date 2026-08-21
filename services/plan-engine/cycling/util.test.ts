// Unit tests for cycling/util.ts.
// Pure function tests — it.each() used throughout because each case is the same
// assertion pattern across varying inputs.
import { describe, it, expect } from 'vitest';
import { calculateTSS, getWeeksToEvent } from './util';

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

// Builds a 'YYYY-MM-DD' date string N days from today, entirely in UTC —
// matching how getWeeksToEvent itself normalizes "today" — rather than
// local setDate() + toISOString(), which can land on a different calendar
// day depending on the local timezone's offset from UTC at test-run time.
function daysFromNowUtc(days: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days))
    .toISOString()
    .split('T')[0];
}

describe('getWeeksToEvent', () => {
  it('returns 10 for a date exactly 70 days away', () => {
    expect(getWeeksToEvent(daysFromNowUtc(70))).toBe(10);
  });

  it('returns 0 for today (never negative)', () => {
    expect(getWeeksToEvent(daysFromNowUtc(0))).toBe(0);
  });

  it('returns a larger value for a further date', () => {
    expect(getWeeksToEvent(daysFromNowUtc(140))).toBeGreaterThan(
      getWeeksToEvent(daysFromNowUtc(70))
    );
  });
});
