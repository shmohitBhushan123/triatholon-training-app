// services/plan-engine/swim/plan.ts
// Public API for swim plan generation. Mode gate only — delegates to generators.ts.
//
// Mode selection (mirrors cycling/plan.ts and run/plan.ts):
//   no targetEventDate   → throw (cannot generate a plan without an event date)
//   < 4 weeks            → throw (too soon to generate a meaningful plan)
//   4–9 weeks            → generateMaintenanceSwimPlan
//   ≥ 10 weeks           → generateFullSwimPlan
//
// CSS zones are defined in util.ts and snapshotted from profile.cssPer100ydSeconds
// at generation time. A future re-test does not change already-generated workouts.

import type { SwimmerProfile, SwimPreferences, SwimWorkout } from './types';
import { generateFullSwimPlan, generateMaintenanceSwimPlan } from './generators';
import { getWeeksToEvent } from './util';

export function generateSwimPlan(
  profile: SwimmerProfile,
  preferences: SwimPreferences
): SwimWorkout[] {
  if (!preferences.targetEventDate) {
    throw new Error('targetEventDate is required to generate a swim plan');
  }

  const weeksToEvent = getWeeksToEvent(preferences.targetEventDate);

  if (weeksToEvent < 4) {
    throw new Error(
      `Event is too soon to generate a plan (${weeksToEvent} week(s) away; minimum is 4)`
    );
  }

  if (weeksToEvent < 10) {
    return generateMaintenanceSwimPlan(weeksToEvent, profile, preferences);
  }

  return generateFullSwimPlan(weeksToEvent, profile, preferences);
}
