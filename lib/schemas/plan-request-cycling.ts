import { z } from 'zod';
import { trainingDaysSchema, goalTypeSchema, dayOfWeekSchema } from './plan-shared';

// Zod schema for POST /api/plans/cycling.
// Validates raw client input only — server-set values (id, userId, updatedAt)
// are assigned in the route handler, not accepted from the client.

export const cyclistProfileInputSchema = z.object({
  ftpWatts: z.number().positive(),
  weightKg: z.number().positive().nullable().optional(),
});

const cyclingPreferencesInputSchema = z.object({
  trainingDays: trainingDaysSchema,
  longRideDay: dayOfWeekSchema,
  goalType: goalTypeSchema,
  targetEvent: z.string().nullable().optional(),
  targetEventDate: z.string().nullable().optional(),
  targetWeeklyRideMinutes: z.number().positive(),
});

export const generateCyclingPlanRequestSchema = z.object({
  profile: cyclistProfileInputSchema,
  preferences: cyclingPreferencesInputSchema,
});

export type GenerateCyclingPlanRequest = z.infer<typeof generateCyclingPlanRequestSchema>;
