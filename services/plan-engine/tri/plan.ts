// services/plan-engine/tri/plan.ts
// Generates a composite triathlon training plan by orchestrating the three
// sport-specific generators under a shared hour budget.
//
// Hour allocation by race distance (defaults, adjustable):
//   Sprint:  45% bike / 35% run / 20% swim
//   Olympic: 45% bike / 35% run / 20% swim
//   70.3:    45% bike / 35% run / 20% swim
//   Full:    50% bike / 30% run / 20% swim
//
// The function returns weekly allocation rows (TriPlanWeek[]).
// Individual workout rows are written to run_workouts, cycling_workouts, and
// swim_workouts by the sport-specific generators called internally.

import type { RunnerProfile } from '../run/types';
import type { CyclistProfile } from '../cycling/types';
import type { SwimmerProfile } from '../swim/types';
import type { TriPreferences, TriPlanWeek } from './types';

export function generateTriPlan(
  runProfile: RunnerProfile,
  cyclingProfile: CyclistProfile,
  swimProfile: SwimmerProfile,
  preferences: TriPreferences
): TriPlanWeek[] {
  // TODO: implement tri plan generation
  // Steps:
  //   1. Calculate weeks to race from preferences.targetRaceDate
  //   2. Determine hour split per sport based on targetRaceDistance
  //   3. For each week, compute run/bike/swim hours with progressive overload and cutbacks
  //   4. Derive training days per sport from preferences.runDays / bikeDays / swimDays
  //   5. Call generateRunPlan, generateCyclingPlan, generateSwimPlan internally
  //      with derived preferences and the shared race date
  //   6. Return TriPlanWeek[] for the tri_plan_weeks table
  void runProfile;
  void cyclingProfile;
  void swimProfile;
  void preferences;
  return [];
}
