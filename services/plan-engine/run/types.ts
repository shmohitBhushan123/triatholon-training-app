// services/plan-engine/run/types.ts
// TypeScript interfaces for running plan inputs and outputs.
// These mirror the DB table shapes defined in supabase/migrations/.
// Pace and power values in workout types are denormalized at generation time —
// a future profile update does not change a workout that already exists in a plan.

export interface RunnerProfile {
  id: string;
  userId: string;
  vdot: number; // e.g. 52
  seedDistance: string; // e.g. 'half_marathon', '5k'
  seedTimeSeconds: number; // e.g. 5865 for 1:37:45
  updatedAt: string;
}

// Shape of the static VDOT lookup table in vdot.ts.
// Pace values are in min/mile (mm:ss format).
export interface VdotPaceConfig {
  easyMinPace: string; // e.g. '8:16' (min/mile)
  easyMaxPace: string; // e.g. '9:00'
  marathonPace: string;
  tempoPace: string;
  intervalPaceMin: string;
  intervalPaceMax: string;
  repPaceMin: string;
  repPaceMax: string;
}

export interface RunPreferences {
  id: string;
  userId: string;
  trainingDays: number[]; // [0,1,3,4,5] where 0=Monday, 6=Sunday
  longRunDay: number; // must be within trainingDays
  goalType: 'completion' | 'time_goal' | 'base_building';
  targetRaceDistance: string | null;
  targetRaceDate: string | null; // ISO date string
}

export interface RunWorkout {
  planId: string;
  weekNumber: number;
  dayOfWeek: number; // 0=Monday
  workoutType: 'easy' | 'tempo' | 'interval' | 'long' | 'rest';
  description: string | null;
  targetDistanceMeters: number | null;
  targetPaceZone: string | null; // e.g. 'easy', 'tempo'
  targetPaceMin: string | null; // snapshotted, e.g. '8:16'
  targetPaceMax: string | null; // snapshotted, e.g. '9:00'
  completed: boolean;
  completedAt: string | null;
}
