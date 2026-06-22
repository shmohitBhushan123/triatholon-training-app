// services/plan-engine/run/generators.ts
// Strategy functions for full periodized and maintenance/taper plan generation.
// Called by generateRunPlan in plan.ts after the mode gate selects which to use.
//
// buildPeriodizedSchedule lives here (not in a separate schedule.ts) because it is
// only ever called by the two generator functions below — same reasoning as why
// generateMaintenancePlan builds its own inline schedule rather than delegating out.

import type { RunnerProfile, RunPreferences, RunWorkout, WeekSpec, TrainingPhase } from './types';
import { getPaceConfig } from './vdot';
import { buildWorkoutsForWeek } from './workout-builder';

const WEEKLY_INCREASE_FACTOR = 1.1;
const CUTBACK_FACTOR = 0.8; // applied every 4th week

export const TAPER_PENULTIMATE_RATIO = 0.65;
export const TAPER_RACE_WEEK_RATIO = 0.45;

// Taper length by race distance. Falls back to 2 weeks when distance is null.
const TAPER_WEEKS_BY_DISTANCE: Partial<Record<string, number>> = {
  '5k': 1,
  '10k': 1,
  half_marathon: 2,
  marathon: 3,
};

// Full periodized plan: Base -> Build 1 -> Build 2 -> Race Prep -> Taper.
// Progressive overload (~10%/week) with cutback every 4th week.
export function generateFullPlan(
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
  return schedule.flatMap((spec) => buildWorkoutsForWeek(spec, preferences, paces, ''));
}

// Builds the week-by-week phase + volume scaffold for a full periodized plan.
// Exported so schedule.test.ts can test it independently of workout generation.
export function buildPeriodizedSchedule(
  weeksToRace: number,
  taperWeeks: number,
  baseVolumeMinutes: number
): WeekSpec[] {
  const activeWeeks = weeksToRace - taperWeeks;
  const baseWks = Math.max(3, Math.round(activeWeeks * 0.28));
  const build1Wks = Math.max(2, Math.round(activeWeeks * 0.22));
  const build2Wks = Math.max(2, Math.round(activeWeeks * 0.22));
  const racePrepWks = Math.max(1, activeWeeks - baseWks - build1Wks - build2Wks);

  const blocks: Array<{ count: number; phase: TrainingPhase }> = [
    { count: baseWks, phase: 'base' },
    { count: build1Wks, phase: 'build1' },
    { count: build2Wks, phase: 'build2' },
    { count: racePrepWks, phase: 'race_prep' },
  ];

  const schedule: WeekSpec[] = [];
  let weekNum = 1;
  let currentVolume = baseVolumeMinutes;
  let peakVolume = baseVolumeMinutes;

  for (const { count, phase } of blocks) {
    for (let i = 0; i < count; i++) {
      if (weekNum > 1) {
        const isCutback = weekNum % 4 === 0;
        currentVolume = isCutback
          ? Math.round(currentVolume * CUTBACK_FACTOR)
          : Math.round(currentVolume * WEEKLY_INCREASE_FACTOR);
      }
      peakVolume = Math.max(peakVolume, currentVolume);
      schedule.push({ weekNumber: weekNum++, phase, volumeMinutes: currentVolume });
    }
  }

  for (let t = 0; t < taperWeeks; t++) {
    const isRaceWeek = t === taperWeeks - 1;
    schedule.push({
      weekNumber: weekNum++,
      phase: 'taper',
      volumeMinutes: Math.round(
        peakVolume * (isRaceWeek ? TAPER_RACE_WEEK_RATIO : TAPER_PENULTIMATE_RATIO)
      ),
    });
  }

  return schedule;
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
      ...buildWorkoutsForWeek(
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
      ...buildWorkoutsForWeek(
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
