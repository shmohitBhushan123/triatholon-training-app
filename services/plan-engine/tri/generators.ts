// services/plan-engine/tri/generators.ts
// Orchestration layer for composite triathlon plan generation.
// This module does NOT reimplement periodization — it derives sport-specific
// preferences from the shared hour budget and delegates to the existing
// generateRunPlan / generateCyclingPlan / generateSwimPlan public APIs, each
// of which already handles its own mode gate (throw / maintenance / full).

import type { RunnerProfile, RunPreferences } from '../run/types';
import type { CyclistProfile, CyclingPreferences } from '../cycling/types';
import type { SwimmerProfile, SwimPreferences } from '../swim/types';
import { generateRunPlan } from '../run/plan';
import { generateCyclingPlan } from '../cycling/plan';
import { generateSwimPlan } from '../swim/plan';
import { swimHoursToYards, swimYardsToHours } from '../swim/util';
import type { TriPreferences, TriPlanResult, TriPlanWeek } from './types';

type TriRaceDistance = TriPreferences['targetRaceDistance'];

// Hour budget split by triathlon distance. Full distance shifts more toward
// the bike leg (biggest time component of an Ironman) at the expense of run.
const HOUR_SPLIT_BY_TRI_DISTANCE: Record<
  TriRaceDistance,
  { bike: number; run: number; swim: number }
> = {
  sprint: { bike: 0.45, run: 0.35, swim: 0.2 },
  olympic: { bike: 0.45, run: 0.35, swim: 0.2 },
  '70.3': { bike: 0.45, run: 0.35, swim: 0.2 },
  full: { bike: 0.5, run: 0.3, swim: 0.2 },
};

// Maps the tri race distance to each sport's own distance/event vocabulary —
// these keys drive taper length lookups inside each sport's generators.ts.
const RUN_DISTANCE_BY_TRI_DISTANCE: Record<TriRaceDistance, string> = {
  sprint: '5k',
  olympic: '10k',
  '70.3': 'half_marathon',
  full: 'marathon',
};

const CYCLING_EVENT_BY_TRI_DISTANCE: Record<TriRaceDistance, string> = {
  sprint: 'triathlon_sprint',
  olympic: 'triathlon_olympic',
  '70.3': 'triathlon_70.3',
  full: 'triathlon_140',
};

const SWIM_EVENT_BY_TRI_DISTANCE: Record<TriRaceDistance, string> = {
  sprint: 'sprint_swim',
  olympic: 'olympic_swim',
  '70.3': '70.3_swim',
  full: '140.6_swim',
};

// No per-sport goal is collected during tri onboarding — 'completion' is the
// sensible default for all three derived preference objects.
const DEFAULT_GOAL_TYPE = 'completion' as const;

// Core orchestration: splits the weekly hour budget by race distance, derives
// sport-specific preferences, delegates to each sport's public plan API, and
// aggregates the results into a TriPlanResult.
export function generateTriPlanResult(
  runProfile: RunnerProfile,
  cyclingProfile: CyclistProfile,
  swimProfile: SwimmerProfile,
  preferences: TriPreferences
): TriPlanResult {
  const split = HOUR_SPLIT_BY_TRI_DISTANCE[preferences.targetRaceDistance];
  const runHours = preferences.hoursPerWeek * split.run;
  const bikeHours = preferences.hoursPerWeek * split.bike;
  const swimHours = preferences.hoursPerWeek * split.swim;

  const runPreferences = deriveRunPreferences(preferences, runHours);
  const cyclingPreferences = deriveCyclingPreferences(preferences, bikeHours);
  const swimPreferences = deriveSwimPreferences(preferences, swimHours, swimProfile);

  const runWorkouts = generateRunPlan(runProfile, runPreferences);
  const cyclingWorkouts = generateCyclingPlan(cyclingProfile, cyclingPreferences);
  const swimWorkouts = generateSwimPlan(swimProfile, swimPreferences);

  const weeks = buildTriPlanWeeks(
    '',
    runWorkouts,
    cyclingWorkouts,
    swimWorkouts,
    swimProfile.cssPer100ydSeconds
  );

  return { weeks, runWorkouts, cyclingWorkouts, swimWorkouts };
}

function deriveRunPreferences(preferences: TriPreferences, runHours: number): RunPreferences {
  const longRunDay = preferences.longRunDay ?? Math.max(...preferences.runDays);
  return {
    id: `${preferences.id}-run`,
    userId: preferences.userId,
    trainingDays: preferences.runDays,
    longRunDay,
    goalType: DEFAULT_GOAL_TYPE,
    targetRaceDistance: RUN_DISTANCE_BY_TRI_DISTANCE[preferences.targetRaceDistance],
    targetRaceDate: preferences.targetRaceDate,
    targetWeeklyRunMinutes: Math.round(runHours * 60),
  };
}

function deriveCyclingPreferences(
  preferences: TriPreferences,
  bikeHours: number
): CyclingPreferences {
  const longRideDay = preferences.longRideDay ?? Math.max(...preferences.bikeDays);
  return {
    id: `${preferences.id}-bike`,
    userId: preferences.userId,
    trainingDays: preferences.bikeDays,
    longRideDay,
    goalType: DEFAULT_GOAL_TYPE,
    targetEvent: CYCLING_EVENT_BY_TRI_DISTANCE[preferences.targetRaceDistance],
    targetEventDate: preferences.targetRaceDate,
    targetWeeklyRideMinutes: Math.round(bikeHours * 60),
  };
}

function deriveSwimPreferences(
  preferences: TriPreferences,
  swimHours: number,
  swimProfile: SwimmerProfile
): SwimPreferences {
  return {
    id: `${preferences.id}-swim`,
    userId: preferences.userId,
    trainingDays: preferences.swimDays,
    goalType: DEFAULT_GOAL_TYPE,
    targetEvent: SWIM_EVENT_BY_TRI_DISTANCE[preferences.targetRaceDistance],
    targetEventDate: preferences.targetRaceDate,
    targetWeeklySwimYards: swimHoursToYards(swimHours, swimProfile.cssPer100ydSeconds),
  };
}

// Aggregates the three sport-specific workout arrays into one row per week,
// summing hours across sports. Assumes all three arrays cover the same set
// of week numbers — true because all three are generated from the same
// targetRaceDate, and buildPeriodizedSchedule/maintenance logic always
// produces exactly weeksToEvent weeks regardless of each sport's taper length.
function buildTriPlanWeeks(
  triPlanId: string,
  runWorkouts: TriPlanResult['runWorkouts'],
  cyclingWorkouts: TriPlanResult['cyclingWorkouts'],
  swimWorkouts: TriPlanResult['swimWorkouts'],
  cssPer100ydSeconds: number
): TriPlanWeek[] {
  const weekNumbers = [...new Set(runWorkouts.map((w) => w.weekNumber))].sort((a, b) => a - b);

  return weekNumbers.map((weekNumber) => {
    const runMinutes =
      runWorkouts.find((w) => w.weekNumber === weekNumber)?.weeklyVolumeMinutes ?? 0;
    const bikeMinutes =
      cyclingWorkouts.find((w) => w.weekNumber === weekNumber)?.weeklyVolumeMinutes ?? 0;
    const swimYards = swimWorkouts.find((w) => w.weekNumber === weekNumber)?.weeklyVolumeYards ?? 0;

    const runHours = runMinutes / 60;
    const bikeHours = bikeMinutes / 60;
    const swimHours = swimYardsToHours(swimYards, cssPer100ydSeconds);

    // Round each leg first, then sum the rounded values for the total. Rounding
    // the raw sum independently can drift from the sum of independently-rounded
    // legs by a cent's worth of an hour — this keeps the two always consistent.
    const roundedRunHours = Math.round(runHours * 100) / 100;
    const roundedBikeHours = Math.round(bikeHours * 100) / 100;
    const roundedSwimHours = Math.round(swimHours * 100) / 100;

    return {
      triPlanId,
      weekNumber,
      totalHoursAllocated:
        Math.round((roundedRunHours + roundedBikeHours + roundedSwimHours) * 100) / 100,
      runHours: roundedRunHours,
      bikeHours: roundedBikeHours,
      swimHours: roundedSwimHours,
    };
  });
}
