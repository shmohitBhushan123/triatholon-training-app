import { describe, it, expect } from 'vitest';
import { getCssZoneBounds, formatPaceSec, yardsToMeters } from './util';

// Reference athlete: CSS = 115s/100yd (1:55/100yd)
const CSS = 115;

describe('formatPaceSec', () => {
  it.each([
    { input: 115, expected: '1:55' },
    { input: 130, expected: '2:10' },
    { input: 90, expected: '1:30' },
    { input: 60, expected: '1:00' },
    { input: 120, expected: '2:00' },
  ])('$input s -> $expected', ({ input, expected }) => {
    expect(formatPaceSec(input)).toBe(expected);
  });
});

describe('getCssZoneBounds — aerobic', () => {
  const bounds = getCssZoneBounds(CSS, 'aerobic');

  it('zone label is aerobic', () => {
    expect(bounds.zone).toBe('aerobic');
  });

  it('minSecPer100yd is CSS + 15', () => {
    expect(bounds.minSecPer100yd).toBe(CSS + 15); // 130
  });

  it('maxSecPer100yd is null (no upper limit)', () => {
    expect(bounds.maxSecPer100yd).toBeNull();
  });
});

describe('getCssZoneBounds — threshold', () => {
  const bounds = getCssZoneBounds(CSS, 'threshold');

  it('zone label is threshold', () => {
    expect(bounds.zone).toBe('threshold');
  });

  it('minSecPer100yd is CSS - 5', () => {
    expect(bounds.minSecPer100yd).toBe(CSS - 5); // 110
  });

  it('maxSecPer100yd is CSS + 5', () => {
    expect(bounds.maxSecPer100yd).toBe(CSS + 5); // 120
  });
});

describe('getCssZoneBounds — speed', () => {
  const bounds = getCssZoneBounds(CSS, 'speed');

  it('zone label is speed', () => {
    expect(bounds.zone).toBe('speed');
  });

  it('minSecPer100yd is null (no lower limit)', () => {
    expect(bounds.minSecPer100yd).toBeNull();
  });

  it('maxSecPer100yd is CSS - 5', () => {
    expect(bounds.maxSecPer100yd).toBe(CSS - 5); // 110
  });
});

describe('yardsToMeters', () => {
  it('2000 yards -> 1829m', () => {
    expect(yardsToMeters(2000)).toBe(Math.round(2000 * 0.9144)); // 1829
  });

  it('100 yards -> 91m', () => {
    expect(yardsToMeters(100)).toBe(91);
  });

  it('0 yards -> 0m', () => {
    expect(yardsToMeters(0)).toBe(0);
  });

  it('a longer pace is slower than CSS (aerobic min > CSS)', () => {
    const aerobic = getCssZoneBounds(CSS, 'aerobic');
    // aerobic minSecPer100yd should be greater (slower) than CSS
    expect(aerobic.minSecPer100yd).toBeGreaterThan(CSS);
  });
});
