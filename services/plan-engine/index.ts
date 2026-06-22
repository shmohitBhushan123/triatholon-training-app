// services/plan-engine/index.ts
// Rules-based triathlon training plan generator.
// Input: athlete profiles + training preferences
// Output: structured workout arrays persisted to the database
//
// This is NOT AI-generated. It is a deterministic algorithm based on
// established triathlon periodization principles (Base → Build → Race Prep → Taper).
// Given the same inputs, it always produces the same plan.

export { deriveVdot, getPaceConfig } from './run/vdot';
export { generateRunPlan } from './run/plan';
export { generateCyclingPlan } from './cycling/plan';
export { generateSwimPlan } from './swim/plan';
export { generateTriPlan } from './tri/plan';
export type { TrainingPhase, WeekSpec } from './schedule';
export type { RunnerProfile, VdotPaceConfig, RunPreferences, RunWorkout } from './run/types';
export type { CyclistProfile, CyclingPreferences, CyclingWorkout } from './cycling/types';
export type { SwimmerProfile, SwimPreferences, SwimWorkout } from './swim/types';
export type { TriPreferences, TriPlanWeek } from './tri/types';
