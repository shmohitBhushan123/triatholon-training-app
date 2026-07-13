// services/plan-engine/swim/generators.ts
// Strategy functions for full periodized and maintenance/taper swim plan generation.
// Mirrors cycling/generators.ts — buildPeriodizedSchedule is imported from the shared
// scheduling layer. IMPORTANT: volumeMinutes in WeekSpec is treated as YARDS here
// (see workout-builder.ts module note). The scheduler's compound-10%/cutback math
// applies identically to yard-based volume.

import type { SwimmerProfile, SwimPreferences, SwimWorkout } from './types';
import {
  buildPeriodizedSchedule,
  TAPER_PENULTIMATE_RATIO,
  TAPER_RACE_WEEK_RATIO,
} from '../schedule';
import { buildSwimmingWorkoutsForWeek } from './workout-builder';

// Taper length by swim event type. Falls back to 2 weeks when event is null.
const TAPER_WEEKS_BY_EVENT: Partial<Record<string, number>> = {
  sprint_swim: 1,
  olympic_swim: 1,
  open_water_1mile: 1,
  open_water_5k: 1,
  '70.3_swim': 2,
  '140.6_swim': 3,
};

// Base weekly yard target derived from the athlete's training goal.
// No user-configurable field in SwimPreferences for MVP — this is the sensible
// default for each goal type. Can be made user-configurable in a future iteration.
const BASE_VOLUME_BY_GOAL: Record<SwimPreferences['goalType'], number> = {
  base_building: 5000,
  completion: 6000,
  time_goal: 8000,
};

// Full periodized plan: Base -> Build 1 -> Build 2 -> Race Prep -> Taper.
// Progressive overload (~10%/week) with cutback every 4th week.
// spec.volumeMinutes from buildPeriodizedSchedule is treated as yards throughout.
export function generateFullSwimPlan(
  weeksToEvent: number,
  profile: SwimmerProfile,
  preferences: SwimPreferences
): SwimWorkout[] {
  const taperWeeks = TAPER_WEEKS_BY_EVENT[preferences.targetEvent ?? ''] ?? 2;
  const baseVolumeYards = BASE_VOLUME_BY_GOAL[preferences.goalType];
  const schedule = buildPeriodizedSchedule(weeksToEvent, taperWeeks, baseVolumeYards);
  return schedule.flatMap((spec) => buildSwimmingWorkoutsForWeek(spec, preferences, profile, ''));
}

// Maintenance/taper plan: flat volume throughout, reduced in final 1-2 weeks.
// Used when there are 4-9 weeks to the event — not enough time for full periodization.
export function generateMaintenanceSwimPlan(
  weeksToEvent: number,
  profile: SwimmerProfile,
  preferences: SwimPreferences
): SwimWorkout[] {
  const taperWeeks = weeksToEvent >= 6 ? 2 : 1;
  const maintenanceWeeks = weeksToEvent - taperWeeks;
  const baseVolumeYards = BASE_VOLUME_BY_GOAL[preferences.goalType];
  const workouts: SwimWorkout[] = [];

  for (let w = 1; w <= maintenanceWeeks; w++) {
    workouts.push(
      ...buildSwimmingWorkoutsForWeek(
        { weekNumber: w, phase: 'maintenance', volumeMinutes: baseVolumeYards },
        preferences,
        profile,
        ''
      )
    );
  }

  for (let t = 0; t < taperWeeks; t++) {
    const isRaceWeek = t === taperWeeks - 1;
    workouts.push(
      ...buildSwimmingWorkoutsForWeek(
        {
          weekNumber: maintenanceWeeks + t + 1,
          phase: 'taper',
          volumeMinutes: Math.round(
            baseVolumeYards * (isRaceWeek ? TAPER_RACE_WEEK_RATIO : TAPER_PENULTIMATE_RATIO)
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
