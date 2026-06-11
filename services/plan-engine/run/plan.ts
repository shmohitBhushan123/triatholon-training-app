// services/plan-engine/run/plan.ts
// Generates a structured running training plan from a runner profile and preferences.
//
// Weekly template logic (days → workout type distribution):
//   2 days: [easy, long]
//   3 days: [easy, tempo, long]
//   4 days: [easy, tempo, easy, long]
//   5 days: [easy, tempo, easy, interval, long]
//   6 days: [easy, tempo, easy, interval, easy, long]
//
// ~80% of weekly volume at Easy pace, ~20% quality (Tempo/Interval).
// Pace values are snapshotted from the VDOT table at generation time.

import type { RunnerProfile, RunPreferences, RunWorkout } from './types';

export function generateRunPlan(profile: RunnerProfile, preferences: RunPreferences): RunWorkout[] {
  // TODO: implement run plan generation
  // Steps:
  //   1. Calculate weeks to race from preferences.targetRaceDate
  //   2. Divide weeks into phases (base, build1, build2, race-prep, taper)
  //   3. For each week, determine weekly volume and cutback weeks
  //   4. Assign workout types to training days using the template above
  //   5. Snapshot pace values from getPaceConfig(profile.vdot) at generation time
  //   6. Return flat array of RunWorkout rows ready to insert into run_workouts
  void profile;
  void preferences;
  return [];
}
