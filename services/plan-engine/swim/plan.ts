// services/plan-engine/swim/plan.ts
// Generates a structured swim training plan from a swimmer profile and preferences.
//
// CSS (Critical Swim Speed) zones:
//   Aerobic:   > CSS + 15s/100yd  (easy, high volume)
//   Moderate:  CSS + 5–15s/100yd
//   Threshold: CSS ± 5s/100yd     (race pace for triathlon swims)
//   Speed:     < CSS - 5s/100yd   (short reps, sprint work)
//
// CSS formula: css_seconds_per_100yd = (tt400_seconds - tt200_seconds) / 2
// Pace values are snapshotted from profile.cssPer100ydSeconds at generation time.

import type { SwimmerProfile, SwimPreferences, SwimWorkout } from './types';

export function generateSwimPlan(
  profile: SwimmerProfile,
  preferences: SwimPreferences
): SwimWorkout[] {
  // TODO: implement swim plan generation
  // Steps:
  //   1. Calculate weeks to event from preferences.targetEventDate
  //   2. Divide weeks into phases (base, build, peak, taper)
  //   3. For each week, assign workout types to training days
  //   4. Snapshot pace ranges from CSS zones × profile.cssPer100ydSeconds at generation time
  //   5. Return flat array of SwimWorkout rows ready to insert into swim_workouts
  void profile;
  void preferences;
  return [];
}
