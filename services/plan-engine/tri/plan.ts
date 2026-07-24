// services/plan-engine/tri/plan.ts
// Public API for composite triathlon plan generation. Mode gate only —
// delegates to generateTriPlanResult in generators.ts, which derives
// sport-specific preferences from the shared hour budget and calls each
// sport's own generateRunPlan / generateCyclingPlan / generateSwimPlan.
//
// Mode selection mirrors every other sport's plan.ts:
//   no targetRaceDate   → throw (cannot generate a plan without a race date)
//   < 4 weeks to race   → throw (too soon to generate a meaningful plan)
//   ≥ 4 weeks to race   → generateTriPlanResult (each sport internally
//                         chooses maintenance vs full periodization)
//
// Hour allocation by race distance (see HOUR_SPLIT_BY_TRI_DISTANCE in
// generators.ts for the exact split):
//   Sprint / Olympic / 70.3: 45% bike / 35% run / 20% swim
//   Full:                    50% bike / 30% run / 20% swim

import type { RunnerProfile } from '../run/types';
import type { CyclistProfile } from '../cycling/types';
import type { SwimmerProfile } from '../swim/types';
import type { TriPreferences, TriPlanResult } from './types';
import { generateTriPlanResult } from './generators';
import { getWeeksToEvent } from '../schedule';

export function generateTriPlan(
  runProfile: RunnerProfile,
  cyclingProfile: CyclistProfile,
  swimProfile: SwimmerProfile,
  preferences: TriPreferences
): TriPlanResult {
  if (!preferences.targetRaceDate) {
    throw new Error('targetRaceDate is required to generate a triathlon plan');
  }

  const weeksToRace = getWeeksToEvent(preferences.targetRaceDate);

  if (weeksToRace < 4) {
    throw new Error(`Race date is too soon: ${weeksToRace} week(s) remaining, minimum 4 required.`);
  }

  return generateTriPlanResult(runProfile, cyclingProfile, swimProfile, preferences);
}
