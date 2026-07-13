// services/plan-engine/swim/workout-builder.ts
// Converts a WeekSpec into a concrete list of SwimWorkout rows.
// CSS pace targets are snapshotted from the athlete's cssPer100ydSeconds at generation time.
//
// NOTE: spec.volumeMinutes is treated as YARDS in this module.
// buildPeriodizedSchedule is reused from the shared scheduler — its compound-10%/cutback
// math applies equally to yard-based volume. The field is named volumeMinutes in the shared
// interface; within swim it represents the target weekly yard total.

import type { SwimmerProfile, SwimPreferences, SwimWorkout } from './types';
import type { WeekSpec } from '../schedule';
import { getCssZoneBounds, formatPaceSec, yardsToMeters } from './util';

type WorkoutToken = 'aerobic' | 'threshold' | 'speed';

// Volume distribution by workout type.
const THRESHOLD_RATIO = 0.2; // 20% of weekly yards at threshold
const SPEED_RATIO = 0.1; // 10% of weekly yards at speed
// Aerobic receives the remaining yards, split equally across all aerobic sessions.

// Maps training day count to an ordered sequence of workout tokens.
// No dedicated "long" day — aerobic sessions fill that role uniformly.
const WEEKLY_TEMPLATES: Record<number, WorkoutToken[]> = {
  2: ['aerobic', 'aerobic'],
  3: ['aerobic', 'threshold', 'aerobic'],
  4: ['aerobic', 'threshold', 'aerobic', 'aerobic'],
  5: ['aerobic', 'threshold', 'aerobic', 'speed', 'aerobic'],
};

// In Base phase, speed work is too intense — demote to aerobic.
function applyPhaseDemotion(token: WorkoutToken, phase: WeekSpec['phase']): WorkoutToken {
  if (token === 'speed' && phase === 'base') return 'aerobic';
  return token;
}

// spec.volumeMinutes is interpreted as yards (see module note above).
export function buildSwimmingWorkoutsForWeek(
  spec: WeekSpec,
  preferences: SwimPreferences,
  profile: SwimmerProfile,
  planId: string
): SwimWorkout[] {
  const css = profile.cssPer100ydSeconds;
  const weeklyYards = spec.volumeMinutes; // yards, see module note

  const templateKey = Math.max(2, Math.min(5, preferences.trainingDays.length));
  const template = WEEKLY_TEMPLATES[templateKey];

  const sortedDays = [...preferences.trainingDays].sort((a, b) => a - b);
  const tokens: WorkoutToken[] = template.map((t) => applyPhaseDemotion(t, spec.phase));

  // Yard totals per workout type.
  const thresholdCount = tokens.filter((t) => t === 'threshold').length;
  const speedCount = tokens.filter((t) => t === 'speed').length;
  const thresholdYards = thresholdCount > 0 ? Math.round(weeklyYards * THRESHOLD_RATIO) : 0;
  const speedYards = speedCount > 0 ? Math.round(weeklyYards * SPEED_RATIO) : 0;
  const aerobicTotal = weeklyYards - thresholdYards - speedYards;
  const aerobicCount = tokens.filter((t) => t === 'aerobic').length;
  const aerobicYards = aerobicCount > 0 ? Math.round(aerobicTotal / aerobicCount) : 0;

  const yardsForToken = (token: WorkoutToken): number => {
    switch (token) {
      case 'threshold':
        return thresholdYards;
      case 'speed':
        return speedYards;
      case 'aerobic':
        return aerobicYards;
    }
  };

  const workouts: SwimWorkout[] = [];

  for (let i = 0; i < Math.min(sortedDays.length, tokens.length); i++) {
    const day = sortedDays[i];
    const token = tokens[i];
    const yards = yardsForToken(token);
    workouts.push(buildWorkout(token, day, yards, weeklyYards, css, spec, planId));
  }

  return workouts; // already sorted — sortedDays is ascending
}

function buildWorkout(
  token: WorkoutToken,
  dayOfWeek: number,
  yards: number,
  weeklyYards: number,
  css: number,
  spec: WeekSpec,
  planId: string
): SwimWorkout {
  const bounds = getCssZoneBounds(css, token);

  // Pace range: faster bound → targetPaceMin; slower bound → targetPaceMax.
  // Null bounds (aerobic max, speed min) stay null — no limit in that direction.
  const targetPaceMin =
    bounds.minSecPer100yd !== null ? formatPaceSec(bounds.minSecPer100yd) : null;
  const targetPaceMax =
    bounds.maxSecPer100yd !== null ? formatPaceSec(bounds.maxSecPer100yd) : null;

  return {
    planId,
    weekNumber: spec.weekNumber,
    phase: spec.phase,
    weeklyVolumeYards: weeklyYards,
    dayOfWeek,
    workoutType: token,
    description: buildDescription(token, yards, targetPaceMin, targetPaceMax),
    targetDistanceMeters: yardsToMeters(yards),
    targetCssZone: token,
    targetPaceMin,
    targetPaceMax,
    completed: false,
    completedAt: null,
  };
}

function buildDescription(
  token: WorkoutToken,
  yards: number,
  paceMin: string | null,
  paceMax: string | null
): string {
  const dist = `${yards.toLocaleString()} yd`;
  switch (token) {
    case 'aerobic': {
      const pace = paceMin ? `${paceMin}+/100yd` : 'easy pace';
      return `Aerobic swim — ${dist} at easy pace (${pace})`;
    }
    case 'threshold': {
      const pace = paceMin && paceMax ? `${paceMin}–${paceMax}/100yd` : 'CSS pace';
      return `Threshold — ${dist} at CSS pace (${pace})`;
    }
    case 'speed': {
      const pace = paceMax ? `<${paceMax}/100yd` : 'sprint pace';
      return `Speed reps — ${dist} at sprint pace (${pace})`;
    }
  }
}
