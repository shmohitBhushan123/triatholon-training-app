// services/plan-engine/run/workout-builder.ts
// Converts a WeekSpec into a concrete list of RunWorkout rows using the weekly
// template and snapshotted VDOT pace values.

import type { RunPreferences, RunWorkout } from './types';
import type { VdotPaceConfig } from './types';
import type { WeekSpec } from './types';
import { minutesToMeters, deriveIntervalPaceMinPerMile } from './util';

type WorkoutToken = 'easy' | 'tempo' | 'interval' | 'long';

// Volume distribution per workout type within a week.
const LONG_RATIO = 0.35;
const QUALITY_RATIO = 0.2; // applied once for tempo, once for interval

// Maps training day count to an ordered sequence of workout types.
// Long run is always assigned to preferences.longRunDay regardless of position here.
const WEEKLY_TEMPLATES: { [days: number]: WorkoutToken[] } = {
  2: ['easy', 'long'],
  3: ['easy', 'tempo', 'long'],
  4: ['easy', 'tempo', 'easy', 'long'],
  5: ['easy', 'tempo', 'easy', 'interval', 'long'],
  6: ['easy', 'tempo', 'easy', 'interval', 'easy', 'long'],
};

export function buildRunningWorkoutsForWeek(
  spec: WeekSpec,
  preferences: RunPreferences,
  paces: VdotPaceConfig,
  planId: string
): RunWorkout[] {
  const { trainingDays, longRunDay } = preferences;

  // Clamp to supported template sizes (2-6).
  const templateKey = Math.max(2, Math.min(6, trainingDays.length));
  const template = WEEKLY_TEMPLATES[templateKey];

  // Non-long days in ascending order.
  const sortedDays = [...trainingDays].sort((a, b) => a - b);
  const nonLongDays = sortedDays.filter((d) => d !== longRunDay);

  // Resolve tokens. Demote 'interval' -> 'easy' when I-pace is not prescribed at this VDOT.
  const nonLongTokens: WorkoutToken[] = template
    .filter((t) => t !== 'long')
    .map((t) => (t === 'interval' && paces.interval400m === null ? 'easy' : t));

  // Volume per workout type.
  const longMinutes = Math.round(spec.volumeMinutes * LONG_RATIO);
  const tempoCount = nonLongTokens.filter((t) => t === 'tempo').length;
  const tempoMinutes = tempoCount > 0 ? Math.round(spec.volumeMinutes * QUALITY_RATIO) : 0;
  const intervalCount = nonLongTokens.filter((t) => t === 'interval').length;
  const intervalMinutes = intervalCount > 0 ? Math.round(spec.volumeMinutes * QUALITY_RATIO) : 0;
  const easyTotal = spec.volumeMinutes - longMinutes - tempoMinutes - intervalMinutes;
  const easyCount = nonLongTokens.filter((t) => t === 'easy').length;
  const easyMinutes = easyCount > 0 ? Math.round(easyTotal / easyCount) : 0;

  const workouts: RunWorkout[] = [];

  for (let i = 0; i < Math.min(nonLongDays.length, nonLongTokens.length); i++) {
    const day = nonLongDays[i];
    const token = nonLongTokens[i];
    let workout: RunWorkout;

    if (token === 'tempo') {
      const tempoMeters = minutesToMeters(tempoMinutes, paces.tempoPace);
      workout = {
        planId,
        weekNumber: spec.weekNumber,
        phase: spec.phase,
        weeklyVolumeMinutes: spec.volumeMinutes,
        dayOfWeek: day,
        workoutType: 'tempo',
        description: `Tempo - ${tempoMinutes} min at T-pace`,
        targetDistanceMeters: tempoMeters,
        targetDistanceMiles: parseFloat((tempoMeters / 1609.344).toFixed(2)),
        targetPaceZone: 'tempo',
        targetPaceMin: paces.tempoPace,
        targetPaceMax: null,
        completed: false,
        completedAt: null,
      };
    } else if (token === 'interval') {
      const iPace = deriveIntervalPaceMinPerMile(paces.interval400m!);
      const intervalMeters = minutesToMeters(intervalMinutes, iPace);
      workout = {
        planId,
        weekNumber: spec.weekNumber,
        phase: spec.phase,
        weeklyVolumeMinutes: spec.volumeMinutes,
        dayOfWeek: day,
        workoutType: 'interval',
        description: `Intervals - 4-5 x 1000m at I-pace`,
        targetDistanceMeters: intervalMeters,
        targetDistanceMiles: parseFloat((intervalMeters / 1609.344).toFixed(2)),
        targetPaceZone: 'interval',
        targetPaceMin: iPace,
        targetPaceMax: null,
        completed: false,
        completedAt: null,
      };
    } else {
      const easyMeters = minutesToMeters(easyMinutes, paces.easyMaxPace);
      workout = {
        planId,
        weekNumber: spec.weekNumber,
        phase: spec.phase,
        weeklyVolumeMinutes: spec.volumeMinutes,
        dayOfWeek: day,
        workoutType: 'easy',
        description: null,
        targetDistanceMeters: easyMeters,
        targetDistanceMiles: parseFloat((easyMeters / 1609.344).toFixed(2)),
        targetPaceZone: 'easy',
        targetPaceMin: paces.easyMinPace,
        targetPaceMax: paces.easyMaxPace,
        completed: false,
        completedAt: null,
      };
    }

    workouts.push(workout);
  }

  // Long run always goes on longRunDay.
  const longMeters = minutesToMeters(longMinutes, paces.easyMaxPace);
  workouts.push({
    planId,
    weekNumber: spec.weekNumber,
    phase: spec.phase,
    weeklyVolumeMinutes: spec.volumeMinutes,
    dayOfWeek: longRunDay,
    workoutType: 'long',
    description: `Long run - ${longMinutes} min easy`,
    targetDistanceMeters: longMeters,
    targetDistanceMiles: parseFloat((longMeters / 1609.344).toFixed(2)),
    targetPaceZone: 'easy',
    targetPaceMin: paces.easyMinPace,
    targetPaceMax: paces.easyMaxPace,
    completed: false,
    completedAt: null,
  });

  return workouts.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}
