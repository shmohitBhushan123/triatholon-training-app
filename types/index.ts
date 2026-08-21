// types/index.ts
// Shared TypeScript types used across the app.
// Zod-inferred types live in lib/schemas/ — import them from there.
// Use this file for types that aren't tied to a specific API schema.
//
// Training-plan/workout types (TrainingPhase, WeekSpec, etc.) live in
// services/plan-engine, not here — that's the one source of truth for
// anything derived from or persisted to the plan/workout tables.
//
// RecoveryStatus lives in services/recovery, not here — that module is the
// only place the green/yellow/red status is actually derived, so the type
// and the logic that gives it meaning stay together.

export type SportType = 'swim' | 'bike' | 'run' | 'brick';
