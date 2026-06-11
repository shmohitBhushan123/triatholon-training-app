// services/plan-engine/cycling/plan.ts
// Generates a structured cycling training plan from a cyclist profile and preferences.
//
// Training zones use the Coggan 7-zone model expressed as % of FTP:
//   Zone 1 — Active Recovery:  < 55% FTP
//   Zone 2 — Endurance:       56–75% FTP
//   Zone 3 — Tempo:           76–90% FTP
//   Zone 4 — Threshold:       91–105% FTP
//   Zone 5 — VO2max:         106–120% FTP
//   Zone 6 — Anaerobic:      121–150% FTP
//   Zone 7 — Neuromuscular:   > 150% FTP
//
// Power values are snapshotted from profile.ftpWatts at generation time.

import type { CyclistProfile, CyclingPreferences, CyclingWorkout } from './types';

export function generateCyclingPlan(
  profile: CyclistProfile,
  preferences: CyclingPreferences
): CyclingWorkout[] {
  // TODO: implement cycling plan generation
  // Steps:
  //   1. Calculate weeks to event from preferences.targetEventDate
  //   2. Divide weeks into phases (base endurance, build, peak, taper)
  //   3. For each week, assign workout types to training days
  //   4. Snapshot watt ranges from Coggan zones × profile.ftpWatts at generation time
  //   5. Return flat array of CyclingWorkout rows ready to insert into cycling_workouts
  void profile;
  void preferences;
  return [];
}
