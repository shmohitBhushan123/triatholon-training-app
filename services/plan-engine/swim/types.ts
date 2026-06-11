// services/plan-engine/swim/types.ts
// TypeScript interfaces for swim plan inputs and outputs.
// These mirror the DB table shapes defined in supabase/migrations/.
// Pace values in workout types are denormalized at generation time —
// a future time trial result does not change a workout that already exists in a plan.

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
  goalType: 'completion' | 'time_goal' | 'base_building';
  targetEvent: string | null;
  targetEventDate: string | null; // ISO date string
}

export interface SwimWorkout {
  planId: string;
  weekNumber: number;
  dayOfWeek: number; // 0=Monday
  workoutType: 'aerobic' | 'threshold' | 'speed' | 'rest';
  description: string | null;
  targetDistanceMeters: number | null;
  targetCssZone: string | null; // e.g. 'aerobic', 'threshold'
  targetPaceMin: string | null; // snapshotted from CSS at generation time
  targetPaceMax: string | null;
  completed: boolean;
  completedAt: string | null;
}
