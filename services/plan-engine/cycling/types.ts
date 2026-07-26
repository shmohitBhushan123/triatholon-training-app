// services/plan-engine/cycling/types.ts
// TypeScript interfaces for cycling plan inputs and outputs.
// These mirror the DB table shapes defined in supabase/migrations/.
// Power values in workout types are denormalized at generation time —
// a future FTP test result does not change a workout that already exists in a plan.

import type { TrainingPhase, GoalType } from '../schedule';

// TrainingPhase and WeekSpec are shared across all sports — re-exported here
// so imports within the cycling module stay local.
export type { TrainingPhase, WeekSpec } from '../schedule';

export interface CyclistProfile {
  id: string;
  userId: string;
  ftpWatts: number; // e.g. 163
  weightKg: number | null;
  updatedAt: string;
}

export interface CyclingPreferences {
  id: string;
  userId: string;
  trainingDays: number[]; // [0,1,3,4,5] where 0=Monday, 6=Sunday
  longRideDay: number; // must be within trainingDays
  goalType: GoalType;
  targetEvent: string | null; // e.g. 'triathlon_70.3', 'gran_fondo'
  targetEventDate: string | null; // ISO date string
  // Collected in hours on the onboarding UI, converted to minutes before storage.
  targetWeeklyRideMinutes: number;
}

export interface CyclingWorkout {
  planId: string;
  weekNumber: number;
  phase: TrainingPhase;
  weeklyVolumeMinutes: number; // total planned ride minutes for this week
  dayOfWeek: number; // 0=Monday
  workoutType: 'recovery' | 'endurance' | 'sweet_spot' | 'threshold' | 'vo2max' | 'long';
  description: string | null;
  targetDurationMinutes: number | null;
  targetPowerZone: string | null; // e.g. 'zone2', 'threshold', 'sweet_spot'
  targetPowerMinWatts: number | null; // snapshotted from FTP% at generation time
  targetPowerMaxWatts: number | null;
  tss: number; // Training Stress Score for this workout
  cadenceRpm: number | null; // target cadence
  cadenceMaxRpm: number | null; // upper bound for cadence ranges (e.g. spin-ups)
  wattsPerKg: number | null; // null when weightKg not set on profile
  completed: boolean;
  completedAt: string | null;
}
