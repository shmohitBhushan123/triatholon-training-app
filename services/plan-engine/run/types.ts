// services/plan-engine/run/types.ts
// TypeScript interfaces for running plan inputs and outputs.
// These mirror the DB table shapes defined in supabase/migrations/.
// Pace and power values in workout types are denormalized at generation time —
// a future profile update does not change a workout that already exists in a plan.

import type { TrainingPhase } from '../schedule';

export interface RunnerProfile {
  id: string;
  userId: string;
  vdot: number; // e.g. 52
  seedDistance: string; // e.g. 'half_marathon', '5k'
  seedTimeSeconds: number; // e.g. 5865 for 1:37:45
  updatedAt: string;
}

// Training pace zones derived from VDOT via the Daniels-Gilbert formula.
// Source: Jack Daniels' Running Formula (physiological model, not the printed
// table — see vdot-formula.ts for derivation). All paces are per mile.
// null = this rep distance is not meaningfully prescribed at this VDOT.
export interface VdotPaceConfig {
  // Easy/Long zone — run anywhere in this range
  easyMinPace: string; // faster end of easy zone (min/mile)
  easyMaxPace: string; // slower end of easy zone (min/mile)

  // Marathon pace — training intensity, not a race time prediction
  marathonPace: string; // min/mile

  // Threshold (T) pace — single target, not a range
  tempoPace: string; // min/mile

  // Interval (I) pace — prescribed as 1000m rep time (Daniels' "Km" column)
  // null = I-pace is not meaningfully prescribed below VDOT 37
  interval400m: string | null;

  // Repetition (R) paces — a single target velocity expressed as split times
  // for each rep distance. null = not meaningfully prescribed at this VDOT.
  rep200m: string | null;
  rep300m: string | null;
  rep400m: string | null;
  rep600m: string | null;
  rep800m: string | null;
}

// Training phases and WeekSpec live in the shared plan-engine scheduling layer.
// Re-exported here so existing imports within the run module remain unchanged.
export type { TrainingPhase, WeekSpec } from '../schedule';

export interface RunPreferences {
  id: string;
  userId: string;
  trainingDays: number[]; // [0,1,3,4,5] where 0=Monday, 6=Sunday
  longRunDay: number; // must be within trainingDays
  goalType: 'completion' | 'time_goal' | 'base_building';
  targetRaceDistance: string | null;
  targetRaceDate: string | null; // ISO date string
  // Collected in hours on the onboarding UI, converted to minutes before storage.
  targetWeeklyRunMinutes: number;
}

export interface RunWorkout {
  planId: string;
  weekNumber: number;
  phase: TrainingPhase;
  weeklyVolumeMinutes: number; // total planned running minutes for this week
  dayOfWeek: number; // 0=Monday
  workoutType: 'easy' | 'tempo' | 'interval' | 'long' | 'rest';
  description: string | null;
  targetDistanceMeters: number | null;
  targetDistanceMiles: number | null;
  targetPaceZone: string | null; // e.g. 'easy', 'tempo'
  targetPaceMin: string | null; // snapshotted min/mile at generation time
  targetPaceMax: string | null; // snapshotted min/mile at generation time
  completed: boolean;
  completedAt: string | null;
}
