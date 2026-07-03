// services/plan-engine/cycling/plan.ts
// Public API for cycling plan generation. Mode gate only — delegates to generators.ts.
//
// Mode selection (mirrors run/plan.ts logic):
//   no targetEventDate              → throw (cannot generate a plan without a race date)
//   < 4 weeks to event              → throw (too soon to generate a meaningful plan)
//   4–9 weeks to event              → generateMaintenanceCyclingPlan
//   ≥ 10 weeks to event             → generateFullCyclingPlan
//
// Training zones use the Coggan 7-zone model expressed as % of FTP.
// Power values are snapshotted from profile.ftpWatts at generation time.

import type { CyclistProfile, CyclingPreferences, CyclingWorkout } from './types';
import {
  generateFullCyclingPlan,
  generateMaintenanceCyclingPlan,
  getWeeksToEvent,
} from './generators';

export function generateCyclingPlan(
  profile: CyclistProfile,
  preferences: CyclingPreferences
): CyclingWorkout[] {
  if (!preferences.targetEventDate) {
    throw new Error('targetEventDate is required to generate a cycling plan');
  }

  const weeksToEvent = getWeeksToEvent(preferences.targetEventDate);

  if (weeksToEvent < 4) {
    throw new Error(
      `Event is too soon to generate a plan (${weeksToEvent} weeks away; minimum is 4)`
    );
  }

  if (weeksToEvent < 10) {
    return generateMaintenanceCyclingPlan(weeksToEvent, profile, preferences);
  }

  return generateFullCyclingPlan(weeksToEvent, profile, preferences);
}
