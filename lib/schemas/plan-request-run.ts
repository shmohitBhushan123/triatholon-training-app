import { z } from 'zod';
import { trainingDaysSchema, goalTypeSchema, dayOfWeekSchema } from './plan-shared';
import { SEED_DISTANCES } from '@/services/plan-engine/run/vdot';

// Zod schema for POST /api/plans/run.
// Validates raw client input only — derived values (VDOT from seed time) and
// server-set values (id, userId, updatedAt) are computed/assigned in the
// route handler, not accepted from the client.

export const runProfileInputSchema = z.object({
  seedDistance: z.enum(SEED_DISTANCES),
  seedTimeSeconds: z.number().positive(),
});

const runPreferencesInputSchema = z.object({
  trainingDays: trainingDaysSchema,
  longRunDay: dayOfWeekSchema,
  goalType: goalTypeSchema,
  targetRaceDistance: z.string().nullable().optional(),
  targetRaceDate: z.string().nullable().optional(),
  targetWeeklyRunMinutes: z.number().positive(),
});

export const generateRunPlanRequestSchema = z.object({
  profile: runProfileInputSchema,
  preferences: runPreferencesInputSchema,
});

export type GenerateRunPlanRequest = z.infer<typeof generateRunPlanRequestSchema>;
