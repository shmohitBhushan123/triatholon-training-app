// services/plan-engine/run/plan.ts
// Public API for the run plan engine.
// Selects the correct generation strategy based on weeks remaining before the race.
//
// Mode selection:
//   < 4 weeks  -> throw (too soon to build a useful plan)
//   4-9 weeks  -> maintenance/taper plan (flat volume, race-ready focus)
//   >= 10 weeks -> full periodized plan (Base -> Build 1 -> Build 2 -> Race Prep -> Taper)

import type { RunnerProfile, RunPreferences, RunWorkout } from './types';
import { getWeeksToRace } from './util';
import { generateFullPlan, generateMaintenancePlan } from './generators';

export function generateRunPlan(profile: RunnerProfile, preferences: RunPreferences): RunWorkout[] {
  if (!preferences.targetRaceDate) {
    throw new Error('targetRaceDate is required to generate a run plan.');
  }

  const weeksToRace = getWeeksToRace(preferences.targetRaceDate);

  if (weeksToRace < 4) {
    throw new Error(`Race date is too soon: ${weeksToRace} week(s) remaining, minimum 4 required.`);
  }

  if (weeksToRace < 10) {
    return generateMaintenancePlan(weeksToRace, profile, preferences);
  }

  return generateFullPlan(weeksToRace, profile, preferences);
}
