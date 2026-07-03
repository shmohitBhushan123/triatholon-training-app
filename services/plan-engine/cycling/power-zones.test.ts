// Unit tests for cycling/power-zones.ts.
// Tests the computed zone bounds against FTP 163w (the athlete's current FTP).
// it.each() is used because each test is the same assertion pattern across varying inputs.
import { describe, it, expect } from 'vitest';
import { getZoneBounds, getSweetSpotBounds } from './power-zones';
import type { CogganZone } from './power-zones';

const FTP = 163;

describe('getZoneBounds — FTP 163w', () => {
  it.each<[CogganZone, number, number | null]>([
    [1, 0, 90], // Z1: 0–55%
    [2, 91, 122], // Z2: 56–75%
    [3, 124, 147], // Z3: 76–90%
    [4, 148, 171], // Z4: 91–105%
    [5, 173, 196], // Z5: 106–120%
    [6, 197, 245], // Z6: 121–150%
    [7, 246, null], // Z7: 151%+ (unbounded)
  ])('zone %i: minWatts=%i, maxWatts=%s', (zone, expectedMin, expectedMax) => {
    const bounds = getZoneBounds(FTP, zone);
    expect(bounds.minWatts).toBe(expectedMin);
    expect(bounds.maxWatts).toBe(expectedMax);
  });

  it('midWatts is between minWatts and maxWatts for bounded zones', () => {
    for (const zone of [1, 2, 3, 4, 5, 6] as CogganZone[]) {
      const { minWatts, maxWatts, midWatts } = getZoneBounds(FTP, zone);
      expect(midWatts).toBeGreaterThanOrEqual(minWatts);
      expect(midWatts).toBeLessThanOrEqual(maxWatts!);
    }
  });

  it('zone 7 has null maxWatts and midWatts equals minWatts', () => {
    const { maxWatts, midWatts, minWatts } = getZoneBounds(FTP, 7);
    expect(maxWatts).toBeNull();
    expect(midWatts).toBe(minWatts);
  });

  it('throws for an unknown zone', () => {
    expect(() => getZoneBounds(FTP, 99 as CogganZone)).toThrow();
  });

  it('cadenceRpm is set for every zone', () => {
    for (const zone of [1, 2, 3, 4, 5, 6, 7] as CogganZone[]) {
      expect(getZoneBounds(FTP, zone).cadenceRpm).toBeGreaterThan(0);
    }
  });
});

describe('getSweetSpotBounds — FTP 163w', () => {
  const ss = getSweetSpotBounds(FTP);

  it('minWatts is 88% of FTP', () => {
    expect(ss.minWatts).toBe(Math.round(0.88 * FTP));
  });

  it('maxWatts is 93% of FTP', () => {
    expect(ss.maxWatts).toBe(Math.round(0.93 * FTP));
  });

  it('midWatts is between min and max', () => {
    expect(ss.midWatts).toBeGreaterThanOrEqual(ss.minWatts);
    expect(ss.midWatts).toBeLessThanOrEqual(ss.maxWatts);
  });

  it('sits above Z3 max (90% FTP) and below Z4 max (105% FTP)', () => {
    const z3 = getZoneBounds(FTP, 3);
    const z4 = getZoneBounds(FTP, 4);
    expect(ss.minWatts).toBeGreaterThan(z3.minWatts);
    expect(ss.maxWatts).toBeLessThan(z4.maxWatts!);
  });
});
