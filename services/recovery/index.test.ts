import { describe, it, expect } from 'vitest';
import { getRecoveryStatus, getRecoveryRecommendation, RECOVERY_RECOMMENDATION } from './index';

describe('getRecoveryStatus', () => {
  // Checks the red/yellow/green thresholds, including the exact boundary
  // scores (32/33 and 66/67), since off-by-one errors here would silently
  // recommend the wrong action to the athlete.
  it.each([
    [0, 'red'],
    [32, 'red'],
    [33, 'yellow'],
    [50, 'yellow'],
    [66, 'yellow'],
    [67, 'green'],
    [100, 'green'],
  ] as const)('maps a score of %i to %s', (score, expected) => {
    expect(getRecoveryStatus(score)).toBe(expected);
  });
});

describe('getRecoveryRecommendation', () => {
  // Confirms the score -> status -> recommendation pipeline end-to-end,
  // rather than re-testing getRecoveryStatus's thresholds directly.
  it.each([
    [20, RECOVERY_RECOMMENDATION.red],
    [50, RECOVERY_RECOMMENDATION.yellow],
    [80, RECOVERY_RECOMMENDATION.green],
  ] as const)('maps a score of %i to %s', (score, expected) => {
    expect(getRecoveryRecommendation(score)).toBe(expected);
  });

  // Locks in the exact copy shown on the recovery badge — if this fails, a
  // label was renamed and the UI/tests need to be checked together.
  it('uses EXECUTE / MODIFY / SKIP as the labels', () => {
    expect(RECOVERY_RECOMMENDATION).toEqual({
      green: 'EXECUTE',
      yellow: 'MODIFY',
      red: 'SKIP',
    });
  });
});
