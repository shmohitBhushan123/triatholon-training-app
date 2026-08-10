import { z } from 'zod';
import { trainingDaysSchema, goalTypeSchema } from './plan-shared';

// Zod schema for POST /api/plans/swim.
// Validates raw client input only — CSS (derived from the two time trials,
// see swim/plan.ts) and server-set values (id, userId, updatedAt) are
// computed/assigned in the route handler, not accepted from the client.

export const swimmerProfileInputSchema = z.object({
  tt400Seconds: z.number().positive(),
  tt200Seconds: z.number().positive(),
});

const swimPreferencesInputSchema = z.object({
  trainingDays: trainingDaysSchema,
  goalType: goalTypeSchema,
  targetEvent: z.string().nullable().optional(),
  targetEventDate: z.string().nullable().optional(),
  targetWeeklySwimYards: z.number().positive().optional(),
});

export const generateSwimPlanRequestSchema = z.object({
  profile: swimmerProfileInputSchema,
  preferences: swimPreferencesInputSchema,
});

export type GenerateSwimPlanRequest = z.infer<typeof generateSwimPlanRequestSchema>;
