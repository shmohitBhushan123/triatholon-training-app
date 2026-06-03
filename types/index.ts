// types/index.ts
// Shared TypeScript types used across the app.
// Zod-inferred types live in lib/schemas/ — import them from there.
// Use this file for types that aren't tied to a specific API schema.

export type SportType = 'swim' | 'bike' | 'run' | 'brick';

export type TrainingPhase = 'base' | 'build1' | 'build2' | 'race-prep' | 'taper';

export type RecoveryStatus = 'green' | 'yellow' | 'red';

export interface PlannedSession {
  id: string;
  date: string; // ISO date string
  sport: SportType;
  phase: TrainingPhase;
  title: string;
  description: string;
  durationMinutes: number;
  completedActivityId?: string; // Strava activity ID if matched
}

export interface TrainingWeek {
  weekNumber: number;
  phase: TrainingPhase;
  isCutbackWeek: boolean;
  sessions: PlannedSession[];
}

export interface TrainingPlan {
  id: string;
  athleteId: string;
  raceDate: string;
  generatedAt: string;
  weeks: TrainingWeek[];
}
