// services/plan-engine/swim/types.ts
// TypeScript interfaces for swim plan inputs and outputs.
// These mirror the DB table shapes defined in supabase/migrations/.
// Pace values in workout types are denormalized at generation time —
// a future time trial result does not change a workout that already exists in a plan.

import type { TrainingPhase, GoalType } from '../schedule';

export interface SwimmerProfile {
  id: string;
  userId: string;
  cssPer100ydSeconds: number; // e.g. 115.0 for 1:55/100yd
  tt400Seconds: number; // 400yd time trial in seconds
  tt200Seconds: number; // 200yd time trial in seconds
  updatedAt: string;
}

export interface SwimPreferences {
  id: string;
  userId: string;
  trainingDays: number[]; // [0,1,3,4,5] where 0=Monday, 6=Sunday
  goalType: GoalType;
  targetEvent: string | null;
  targetEventDate: string | null; // ISO date string
  // Optional override for base weekly yard volume. When omitted, generators.ts
  // derives a sensible default from goalType. Set by the tri plan orchestrator
  // when swim volume is driven by an overall weekly hour budget rather than a
  // standalone swim goal.
  targetWeeklySwimYards?: number;
}

export interface SwimWorkout {
  planId: string;
  weekNumber: number;
  dayOfWeek: number; // 0=Monday
  phase: TrainingPhase; // snapshotted from the schedule at generation time
  workoutType: 'aerobic' | 'threshold' | 'speed' | 'rest';
  description: string | null;
  targetDistanceMeters: number | null;
  weeklyVolumeYards: number; // total yard target for the week this workout belongs to
  targetCssZone: string | null; // e.g. 'aerobic', 'threshold'
  targetPaceMin: string | null; // snapshotted from CSS at generation time
  targetPaceMax: string | null;
  completed: boolean;
  completedAt: string | null;
}
