// services/plan-engine/run/generators.ts
// Strategy functions for full periodized and maintenance/taper plan generation.
// Called by generateRunPlan in plan.ts after the mode gate selects which to use.

import type { RunnerProfile, RunPreferences, RunWorkout } from './types';
import {
  buildPeriodizedSchedule,
  TAPER_PENULTIMATE_RATIO,
  TAPER_RACE_WEEK_RATIO,
} from '../schedule';
import { getPaceConfig } from './vdot';
import { buildRunningWorkoutsForWeek } from './workout-builder';

// Taper length by race distance. Falls back to 2 weeks when distance is null.
const TAPER_WEEKS_BY_DISTANCE: Partial<Record<string, number>> = {
  '5k': 1,
  '10k': 1,
  half_marathon: 2,
  marathon: 3,
};

// Full periodized plan: Base -> Build 1 -> Build 2 -> Race Prep -> Taper.
// Progressive overload (~10%/week) with cutback every 4th week.
export function generateFullRunningPlan(
  weeksToRace: number,
  profile: RunnerProfile,
  preferences: RunPreferences
): RunWorkout[] {
  const taperWeeks = TAPER_WEEKS_BY_DISTANCE[preferences.targetRaceDistance ?? ''] ?? 2;
  const paces = getPaceConfig(profile.vdot);
  const schedule = buildPeriodizedSchedule(
    weeksToRace,
    taperWeeks,
    preferences.targetWeeklyRunMinutes
  );
  return schedule.flatMap((spec) => buildRunningWorkoutsForWeek(spec, preferences, paces, ''));
}

// Maintenance/taper plan: flat volume throughout, reduced in final 1-2 weeks.
// Used when there are 4-9 weeks to race -- not enough time for full periodization.
export function generateMaintenancePlan(
  weeksToRace: number,
  profile: RunnerProfile,
  preferences: RunPreferences
): RunWorkout[] {
  const paces = getPaceConfig(profile.vdot);
  const taperWeeks = weeksToRace >= 6 ? 2 : 1;
  const maintenanceWeeks = weeksToRace - taperWeeks;
  const baseVolume = preferences.targetWeeklyRunMinutes;
  const workouts: RunWorkout[] = [];

  for (let w = 1; w <= maintenanceWeeks; w++) {
    workouts.push(
      ...buildRunningWorkoutsForWeek(
        { weekNumber: w, phase: 'maintenance', volumeMinutes: baseVolume },
        preferences,
        paces,
        ''
      )
    );
  }

  for (let t = 0; t < taperWeeks; t++) {
    const isRaceWeek = t === taperWeeks - 1;
    workouts.push(
      ...buildRunningWorkoutsForWeek(
        {
          weekNumber: maintenanceWeeks + t + 1,
          phase: 'taper',
          volumeMinutes: Math.round(
            baseVolume * (isRaceWeek ? TAPER_RACE_WEEK_RATIO : TAPER_PENULTIMATE_RATIO)
          ),
        },
        preferences,
        paces,
        ''
      )
    );
  }

  return workouts;
}
