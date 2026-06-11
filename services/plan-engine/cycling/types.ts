// services/plan-engine/cycling/types.ts
// TypeScript interfaces for cycling plan inputs and outputs.
// These mirror the DB table shapes defined in supabase/migrations/.
// Power values in workout types are denormalized at generation time —
// a future FTP test result does not change a workout that already exists in a plan.

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
  goalType: 'completion' | 'time_goal' | 'base_building';
  targetEvent: string | null;
  targetEventDate: string | null; // ISO date string
}

export interface CyclingWorkout {
  planId: string;
  weekNumber: number;
  dayOfWeek: number; // 0=Monday
  workoutType: 'endurance' | 'tempo' | 'threshold' | 'vo2max' | 'rest';
  description: string | null;
  targetDurationSeconds: number | null;
  targetPowerZone: string | null; // e.g. 'zone2', 'threshold'
  targetPowerMinWatts: number | null; // snapshotted from FTP% at generation time
  targetPowerMaxWatts: number | null;
  completed: boolean;
  completedAt: string | null;
}
