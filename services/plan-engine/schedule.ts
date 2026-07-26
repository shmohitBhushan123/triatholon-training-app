// services/plan-engine/schedule.ts
// Shared scheduling primitives used by all sport-specific plan engines.
//
// TrainingPhase and WeekSpec are sport-agnostic — Base/Build/Taper applies
// equally to swim, bike, and run. buildPeriodizedSchedule is pure calendar
// math with no sport-specific logic; each sport's generators.ts imports it
// rather than duplicating the implementation.

// Training phases used to label each week of a generated plan.
// 'maintenance' is used when there are too few weeks for full periodization.
export type TrainingPhase = 'base' | 'build1' | 'build2' | 'race_prep' | 'taper' | 'maintenance';

// Athlete's stated goal for a training block — sport-agnostic, referenced by
// RunPreferences, CyclingPreferences, and SwimPreferences. Single source of
// truth so the TypeScript type and lib/schemas/plan-shared.ts's Zod schema
// can never drift apart.
export const GOAL_TYPES = ['completion', 'time_goal', 'base_building'] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

// Week-level scaffold produced by buildPeriodizedSchedule and consumed by
// each sport's workout-builder.
export interface WeekSpec {
  weekNumber: number;
  phase: TrainingPhase;
  volumeMinutes: number;
}

const WEEKLY_INCREASE_FACTOR = 1.1;
const CUTBACK_FACTOR = 0.8; // applied every 4th week

export const TAPER_PENULTIMATE_RATIO = 0.65;
export const TAPER_RACE_WEEK_RATIO = 0.45;

// Builds the week-by-week phase + volume scaffold for a full periodized plan.
// Phases: Base → Build 1 → Build 2 → Race Prep → Taper.
// Volume compounds ×1.1 each week; every 4th week drops ×0.8 (cutback).
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

// Whole weeks from today to a target date (ceiling). Used by all sport plan gates.
// 'event', 'race', and 'ride' are the same concept — the date you're training toward.
export function getWeeksToEvent(targetDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(targetDate);
  event.setHours(0, 0, 0, 0);
  const diffMs = event.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
}
