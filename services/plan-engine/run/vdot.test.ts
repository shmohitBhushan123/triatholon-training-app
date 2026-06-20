import { describe, it, expect } from 'vitest';
import { deriveVdot, getPaceConfig } from './vdot';

describe('deriveVdot', () => {
  it.each([
    // Confirmed against RunSmart VDOT calculator (runsmartproject.com/calculator)
    { seedDistance: 'half_marathon', seedTimeSeconds: 5865, expected: 46 }, // 1:37:45
    { seedDistance: '5k', seedTimeSeconds: 1260, expected: 47 }, // 21:00
    { seedDistance: '10k', seedTimeSeconds: 2700, expected: 45 }, // 45:00
    { seedDistance: 'marathon', seedTimeSeconds: 13500, expected: 41 }, // 3:45:00
    { seedDistance: 'mile', seedTimeSeconds: 360, expected: 48 }, // 6:00
  ])(
    '$seedDistance in $seedTimeSeconds s → VDOT $expected',
    ({ seedDistance, seedTimeSeconds, expected }) => {
      expect(deriveVdot(seedDistance, seedTimeSeconds)).toBe(expected);
    }
  );

  it('throws on unknown seed distance', () => {
    expect(() => deriveVdot('triathlon', 5000)).toThrow('Unsupported seed distance: "triathlon"');
  });
});

describe('getPaceConfig', () => {
  it('returns correct paces for VDOT 46 (athlete benchmark)', () => {
    const result = getPaceConfig(46);
    expect(result.easyMinPace).toBe('8:31');
    expect(result.easyMaxPace).toBe('9:34');
    expect(result.marathonPace).toBe('7:49');
    expect(result.tempoPace).toBe('7:17');
    expect(result.interval400m).toBe('4:12');
    expect(result.rep200m).toBe('0:46');
    expect(result.rep400m).toBe('1:09');
    expect(result.rep800m).toBeNull();
  });

  it('returns nulls for rep distances not prescribed at low VDOT (30)', () => {
    const result = getPaceConfig(30);
    expect(result.interval400m).toBeNull();
    expect(result.rep400m).toBeNull();
    expect(result.rep800m).toBeNull();
    expect(result.rep200m).toBe('1:07');
  });

  it('throws for VDOT below range', () => {
    expect(() => getPaceConfig(29)).toThrow('VDOT out of range: 29');
  });

  it('throws for VDOT above range', () => {
    expect(() => getPaceConfig(86)).toThrow('VDOT out of range: 86');
  });
});
