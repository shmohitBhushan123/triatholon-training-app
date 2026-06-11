import { describe, it, expect } from 'vitest';
import { deriveVdot, getPaceConfig } from './vdot';

describe('deriveVdot', () => {
  it('returns a number', () => {
    const result = deriveVdot('half_marathon', 5865);
    expect(typeof result).toBe('number');
  });
});

describe('getPaceConfig', () => {
  it('returns an object', () => {
    const result = getPaceConfig(46);
    expect(typeof result).toBe('object');
  });
});
