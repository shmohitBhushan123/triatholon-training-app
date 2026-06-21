// services/plan-engine/run/schedule.ts
// Builds the week-by-week schedule (phase label + volume) for a full periodized plan.
// Consumed by generators.ts — not part of the public API.

import type { TrainingPhase } from './types';

const WEEKLY_INCREASE_FACTOR = 1.1;
const CUTBACK_FACTOR = 0.8; // applied every 4th week

// Exported so generators.ts can apply the same ratios in maintenance taper weeks.
export const TAPER_PENULTIMATE_RATIO = 0.65;
export const TAPER_RACE_WEEK_RATIO = 0.45;

export interface WeekSpec {
  weekNumber: number;
  phase: TrainingPhase;
  volumeMinutes: number;
}

export function buildFullSchedule(
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
