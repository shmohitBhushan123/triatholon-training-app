// services/plan-engine/cycling/generators.ts
// Strategy functions for full periodized and maintenance/taper cycling plan generation.
// Mirrors run/generators.ts — buildPeriodizedSchedule is imported from the shared
// plan-engine scheduling layer rather than duplicated here.

import type { CyclistProfile, CyclingPreferences, CyclingWorkout } from './types';
import {
  buildPeriodizedSchedule,
  TAPER_PENULTIMATE_RATIO,
  TAPER_RACE_WEEK_RATIO,
} from '../schedule';
import { buildCyclingWorkoutsForWeek } from './workout-builder';
import { getWeeksToEvent } from './util';

// Taper length by event type. Falls back to 2 weeks when event is null.
const TAPER_WEEKS_BY_EVENT: Partial<Record<string, number>> = {
  gran_fondo: 1,
  century: 1,
  triathlon_sprint: 1,
  triathlon_olympic: 1,
  'triathlon_70.3': 2,
  triathlon_140: 3,
};

// Full periodized plan: Base -> Build 1 -> Build 2 -> Race Prep -> Taper.
// Progressive overload (~10%/week) with cutback every 4th week.
export function generateFullCyclingPlan(
  weeksToEvent: number,
  profile: CyclistProfile,
  preferences: CyclingPreferences
): CyclingWorkout[] {
  const taperWeeks = TAPER_WEEKS_BY_EVENT[preferences.targetEvent ?? ''] ?? 2;
  const schedule = buildPeriodizedSchedule(
    weeksToEvent,
    taperWeeks,
    preferences.targetWeeklyRideMinutes
  );
  return schedule.flatMap((spec) => buildCyclingWorkoutsForWeek(spec, preferences, profile, ''));
}

// Maintenance/taper plan: flat volume throughout, reduced in final 1-2 weeks.
// Used when there are 4-9 weeks to the event — not enough time for full periodization.
export function generateMaintenanceCyclingPlan(
  weeksToEvent: number,
  profile: CyclistProfile,
  preferences: CyclingPreferences
): CyclingWorkout[] {
  const taperWeeks = weeksToEvent >= 6 ? 2 : 1;
  const maintenanceWeeks = weeksToEvent - taperWeeks;
  const baseVolume = preferences.targetWeeklyRideMinutes;
  const workouts: CyclingWorkout[] = [];

  for (let w = 1; w <= maintenanceWeeks; w++) {
    workouts.push(
      ...buildCyclingWorkoutsForWeek(
        { weekNumber: w, phase: 'maintenance', volumeMinutes: baseVolume },
        preferences,
        profile,
        ''
      )
    );
  }

  for (let t = 0; t < taperWeeks; t++) {
    const isRaceWeek = t === taperWeeks - 1;
    workouts.push(
      ...buildCyclingWorkoutsForWeek(
        {
          weekNumber: maintenanceWeeks + t + 1,
          phase: 'taper',
          volumeMinutes: Math.round(
            baseVolume * (isRaceWeek ? TAPER_RACE_WEEK_RATIO : TAPER_PENULTIMATE_RATIO)
          ),
        },
        preferences,
        profile,
        ''
      )
    );
  }

  return workouts;
}

// Re-exported so plan.ts can call getWeeksToEvent without an extra import.
export { getWeeksToEvent };
