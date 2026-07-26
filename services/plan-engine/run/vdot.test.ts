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
    expect(result.easyMinPace).toBe('8:29');
    expect(result.easyMaxPace).toBe('9:34');
    expect(result.marathonPace).toBe('7:46');
    expect(result.tempoPace).toBe('7:19');
    expect(result.interval400m).toBe('4:11');
    expect(result.rep200m).toBe('0:46');
    expect(result.rep300m).toBe('1:09');
    expect(result.rep400m).toBe('1:32');
    expect(result.rep600m).toBe('2:18');
    expect(result.rep800m).toBeNull();
  });

  it('returns nulls for rep distances not prescribed at low VDOT (30)', () => {
    const result = getPaceConfig(30);
    expect(result.interval400m).toBeNull();
    expect(result.rep300m).toBeNull();
    expect(result.rep400m).toBeNull();
    expect(result.rep600m).toBeNull();
    expect(result.rep800m).toBeNull();
    expect(result.rep200m).toBe('1:05');
  });

  it('rep800m is always null — 800m is not a meaningful "R" (fast rep) distance', () => {
    expect(getPaceConfig(30).rep800m).toBeNull();
    expect(getPaceConfig(52).rep800m).toBeNull();
    expect(getPaceConfig(85).rep800m).toBeNull();
  });

  // Cross-checks against the real printed table (Daniels' Running Formula,
  // Table 5.2), confirmed directly from a photo of the source. These validate
  // the computed model against ground truth without reproducing the table in
  // the codebase. A few seconds of drift is expected — the formula is a fit,
  // not a copy — and R400m/R600m are fields the old (buggy) static table never
  // captured correctly in the first place, so this is stronger evidence than
  // the table it replaced.
  it('closely matches the real book values for VDOT 46 (within 2s)', () => {
    const result = getPaceConfig(46);
    expect(result.rep200m).toBe('0:46'); // book: 46
    expect(result.rep300m).toBe('1:09'); // book: 69s = 1:09
    // book R400m = 92s = 1:32; formula = 1:32 (91.8s rounds to 1:32)
    expect(result.rep400m).toBe('1:32');
  });

  it('closely matches the real book values for VDOT 52 (within 2s)', () => {
    const result = getPaceConfig(52);
    expect(result.rep200m).toBe('0:42'); // book: 42
    // book R300m = 64s = 1:04; formula = 1:02 (2s drift)
    expect(result.rep300m).toBe('1:02');
    // book R400m = 85s = 1:25; formula = 1:23 (2s drift)
    expect(result.rep400m).toBe('1:23');
  });

  it('throws for VDOT below range', () => {
    expect(() => getPaceConfig(29)).toThrow('VDOT out of range: 29');
  });

  it('throws for VDOT above range', () => {
    expect(() => getPaceConfig(86)).toThrow('VDOT out of range: 86');
  });
});
