// services/plan-engine/tri/types.ts
// TypeScript interfaces for the composite triathlon plan.
// These mirror the DB table shapes defined in supabase/migrations/.
// Sport-specific types (RunWorkout, CyclingWorkout, SwimWorkout) live in
// their respective subdirectories.

export interface TriPreferences {
  id: string;
  userId: string;
  hoursPerWeek: number;
  runDays: number[]; // [0,1,3,4,5] where 0=Monday, 6=Sunday
  bikeDays: number[];
  swimDays: number[];
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
