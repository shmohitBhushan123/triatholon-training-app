import { describe, it, expect } from 'vitest';
import { getRecoveryStatus, getRecoveryRecommendation, RECOVERY_RECOMMENDATION } from './index';

describe('getRecoveryStatus', () => {
  it('returns red below 33', () => {
    expect(getRecoveryStatus(0)).toBe('red');
    expect(getRecoveryStatus(32)).toBe('red');
  });

  it('returns yellow from 33 through 66', () => {
    expect(getRecoveryStatus(33)).toBe('yellow');
    expect(getRecoveryStatus(50)).toBe('yellow');
    expect(getRecoveryStatus(66)).toBe('yellow');
  });

  it('returns green above 66', () => {
    expect(getRecoveryStatus(67)).toBe('green');
    expect(getRecoveryStatus(100)).toBe('green');
  });
});

describe('getRecoveryRecommendation', () => {
  it('maps each status to its recommendation label', () => {
    expect(getRecoveryRecommendation(20)).toBe(RECOVERY_RECOMMENDATION.red);
    expect(getRecoveryRecommendation(50)).toBe(RECOVERY_RECOMMENDATION.yellow);
    expect(getRecoveryRecommendation(80)).toBe(RECOVERY_RECOMMENDATION.green);
  });

  it('uses EXECUTE / MODIFY / SKIP as the labels', () => {
    expect(RECOVERY_RECOMMENDATION).toEqual({
      green: 'EXECUTE',
      yellow: 'MODIFY',
      red: 'SKIP',
    });
  });
});
