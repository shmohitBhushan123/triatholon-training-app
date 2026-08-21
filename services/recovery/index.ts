// services/recovery/index.ts
// Whoop recovery overlay logic.
// Maps a Whoop recovery score (0-100) to a green/yellow/red status and the
// athlete-facing recommendation: execute the session as written, modify it,
// or skip it. Thresholds follow Whoop's own recovery convention.

// The only place a RecoveryStatus is derived — kept here rather than in the
// shared types/ file, since nothing else independently produces one.
export type RecoveryStatus = 'green' | 'yellow' | 'red';

const RED_MAX = 33; // scores below this are red
const YELLOW_MAX = 66; // scores from RED_MAX..YELLOW_MAX are yellow; above is green

// Applies the green/yellow/red thresholds to a raw recovery score.
export function getRecoveryStatus(recoveryScore: number): RecoveryStatus {
  if (recoveryScore < RED_MAX) return 'red';
  if (recoveryScore <= YELLOW_MAX) return 'yellow';
  return 'green';
}

// The recommendation shown alongside the recovery score/status badge.
export const RECOVERY_RECOMMENDATION: Record<RecoveryStatus, string> = {
  green: 'EXECUTE',
  yellow: 'MODIFY',
  red: 'SKIP',
};

// Convenience wrapper: score straight to recommendation label.
export function getRecoveryRecommendation(recoveryScore: number): string {
  return RECOVERY_RECOMMENDATION[getRecoveryStatus(recoveryScore)];
}
