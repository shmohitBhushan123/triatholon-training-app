// services/plan-engine/tri/types.ts
// TypeScript interfaces for the composite triathlon plan.
// These mirror the DB table shapes defined in supabase/migrations/.
// Sport-specific types (RunWorkout, CyclingWorkout, SwimWorkout) live in
// their respective subdirectories.

import type { RunWorkout } from '../run/types';
import type { CyclingWorkout } from '../cycling/types';
import type { SwimWorkout } from '../swim/types';

export interface TriPreferences {
  id: string;
  userId: string;
  hoursPerWeek: number;
  runDays: number[]; // [0,1,3,4,5] where 0=Monday, 6=Sunday
  bikeDays: number[];
  swimDays: number[];
  // Optional — which day within runDays/bikeDays carries the long session.
  // Defaults to the last (highest-numbered) day in the respective array when omitted.
  longRunDay?: number;
  longRideDay?: number;
  targetRaceDistance: 'sprint' | 'olympic' | '70.3' | 'full';
  targetRaceDate: string; // ISO date string
}

export interface TriPlanWeek {
  triPlanId: string;
  weekNumber: number;
  totalHoursAllocated: number;
  runHours: number;
  bikeHours: number;
  swimHours: number;
}

// Combined output of generateTriPlan — the weekly hour-allocation summary plus
// the concrete workout rows produced by each sport-specific generator. Callers
// persist runWorkouts/cyclingWorkouts/swimWorkouts to their respective tables
// and weeks to tri_plan_weeks.
export interface TriPlanResult {
  weeks: TriPlanWeek[];
  runWorkouts: RunWorkout[];
  cyclingWorkouts: CyclingWorkout[];
  swimWorkouts: SwimWorkout[];
}
