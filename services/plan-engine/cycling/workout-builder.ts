// services/plan-engine/cycling/workout-builder.ts
// Converts a WeekSpec into a concrete list of CyclingWorkout rows.
// Power targets and cadence are snapshotted from Coggan zone bounds at generation time.

import type { CyclistProfile, CyclingPreferences, CyclingWorkout } from './types';
import type { WeekSpec, TrainingPhase } from './types';
import { getZoneBounds, getSweetSpotBounds } from './power-zones';
import { calculateTSS } from './util';

type WorkoutToken = 'recovery' | 'endurance' | 'sweet_spot' | 'threshold' | 'long';

// Volume distribution per workout type within a week.
const LONG_RATIO = 0.4;
const QUALITY_RATIO = 0.2; // applied once per quality session (sweet_spot, threshold)

// Maps training day count to an ordered sequence of workout types.
// Long ride is always assigned to preferences.longRideDay regardless of position here.
const WEEKLY_TEMPLATES: Record<number, WorkoutToken[]> = {
  2: ['endurance', 'long'],
  3: ['endurance', 'sweet_spot', 'long'],
  4: ['recovery', 'sweet_spot', 'endurance', 'long'],
  5: ['recovery', 'sweet_spot', 'endurance', 'threshold', 'long'],
  6: ['recovery', 'sweet_spot', 'endurance', 'threshold', 'endurance', 'long'],
};

// In Base phase, threshold is too intense — demote to sweet_spot.
function applyPhaseDemotion(token: WorkoutToken, phase: TrainingPhase): WorkoutToken {
  if (token === 'threshold' && phase === 'base') return 'sweet_spot';
  return token;
}

export function buildCyclingWorkoutsForWeek(
  spec: WeekSpec,
  preferences: CyclingPreferences,
  profile: CyclistProfile,
  planId: string
): CyclingWorkout[] {
  const { trainingDays, longRideDay, targetWeeklyRideMinutes: _ } = preferences;
  const ftp = profile.ftpWatts;

  const templateKey = Math.max(2, Math.min(6, trainingDays.length));
  const template = WEEKLY_TEMPLATES[templateKey];

  const sortedDays = [...trainingDays].sort((a, b) => a - b);
  const nonLongDays = sortedDays.filter((d) => d !== longRideDay);

  const nonLongTokens: WorkoutToken[] = template
    .filter((t) => t !== 'long')
    .map((t) => applyPhaseDemotion(t, spec.phase));

  // Volume per workout type.
  const longMinutes = Math.round(spec.volumeMinutes * LONG_RATIO);
  const qualityTypes = ['sweet_spot', 'threshold'] as const;
  const qualityMinutes = (token: WorkoutToken) =>
    qualityTypes.includes(token as (typeof qualityTypes)[number])
      ? Math.round(spec.volumeMinutes * QUALITY_RATIO)
      : 0;

  const totalQualityMinutes = nonLongTokens.reduce((sum, t) => sum + qualityMinutes(t), 0);
  const baseCount = nonLongTokens.filter((t) => t === 'recovery' || t === 'endurance').length;
  const baseTotal = spec.volumeMinutes - longMinutes - totalQualityMinutes;
  const baseMinutes = baseCount > 0 ? Math.round(baseTotal / baseCount) : 0;

  const minutesForToken = (token: WorkoutToken): number => {
    if (token === 'long') return longMinutes;
    if (token === 'recovery' || token === 'endurance') return baseMinutes;
    return qualityMinutes(token);
  };

  const workouts: CyclingWorkout[] = [];

  for (let i = 0; i < Math.min(nonLongDays.length, nonLongTokens.length); i++) {
    const day = nonLongDays[i];
    const token = nonLongTokens[i];
    const durationMinutes = minutesForToken(token);
    workouts.push(buildWorkout(token, day, durationMinutes, spec, ftp, profile.weightKg, planId));
  }

  // Long ride always goes on longRideDay.
  workouts.push(
    buildWorkout('long', longRideDay, longMinutes, spec, ftp, profile.weightKg, planId)
  );

  return workouts.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

function buildWorkout(
  token: WorkoutToken,
  dayOfWeek: number,
  durationMinutes: number,
  spec: WeekSpec,
  ftpWatts: number,
  weightKg: number | null,
  planId: string
): CyclingWorkout {
  const { minWatts, maxWatts, midWatts, cadenceRpm, cadenceMaxRpm, name, zoneLabel } =
    resolveZoneData(token, ftpWatts);

  const tss = calculateTSS(durationMinutes, midWatts, ftpWatts);
  const wattsPerKg = weightKg ? parseFloat((midWatts / weightKg).toFixed(2)) : null;

  return {
    planId,
    weekNumber: spec.weekNumber,
    phase: spec.phase,
    weeklyVolumeMinutes: spec.volumeMinutes,
    dayOfWeek,
    workoutType: token === 'long' ? 'long' : token,
    description: buildDescription(token, durationMinutes, name),
    targetDurationMinutes: durationMinutes,
    targetPowerZone: zoneLabel,
    targetPowerMinWatts: minWatts,
    targetPowerMaxWatts: maxWatts,
    tss,
    cadenceRpm,
    cadenceMaxRpm,
    wattsPerKg,
    completed: false,
    completedAt: null,
  };
}

interface ResolvedZone {
  name: string;
  zoneLabel: string;
  minWatts: number;
  maxWatts: number | null;
  midWatts: number;
  cadenceRpm: number;
  cadenceMaxRpm: number | null;
}

function resolveZoneData(token: WorkoutToken, ftpWatts: number): ResolvedZone {
  switch (token) {
    case 'recovery': {
      const z = getZoneBounds(ftpWatts, 1);
      return { zoneLabel: 'zone1', ...z };
    }
    case 'endurance':
    case 'long': {
      const z = getZoneBounds(ftpWatts, 2);
      return { zoneLabel: 'zone2', ...z };
    }
    case 'sweet_spot': {
      const ss = getSweetSpotBounds(ftpWatts);
      return { zoneLabel: 'sweet_spot', ...ss };
    }
    case 'threshold': {
      const z = getZoneBounds(ftpWatts, 4);
      return { zoneLabel: 'zone4', ...z };
    }
  }
}

function buildDescription(token: WorkoutToken, durationMinutes: number, zoneName: string): string {
  switch (token) {
    case 'recovery':
      return `Recovery ride — ${durationMinutes} min at ${zoneName}`;
    case 'endurance':
      return `Endurance ride — ${durationMinutes} min at ${zoneName}`;
    case 'sweet_spot':
      return `Sweet spot — ${durationMinutes} min at ${zoneName}`;
    case 'threshold':
      return `Threshold — ${durationMinutes} min at ${zoneName}`;
    case 'long':
      return `Long ride — ${durationMinutes} min at ${zoneName}`;
  }
}
