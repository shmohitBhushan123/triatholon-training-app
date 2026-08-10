import { z } from 'zod';
import { trainingDaysSchema, dayOfWeekSchema } from './plan-shared';
import { runProfileInputSchema } from './plan-request-run';
import { cyclistProfileInputSchema } from './plan-request-cycling';
import { swimmerProfileInputSchema } from './plan-request-swim';
import { TRI_RACE_DISTANCES } from '@/services/plan-engine/tri/types';

// Zod schema for POST /api/plans/tri.
// Reuses the run/cycling/swim profile schemas rather than redefining them a
// third time. Validates raw client input only — server-set values (id,
// userId, updatedAt) are assigned in the route handler.

const triPreferencesInputSchema = z.object({
  hoursPerWeek: z.number().min(5).max(20),
  runDays: trainingDaysSchema,
  bikeDays: trainingDaysSchema,
  swimDays: trainingDaysSchema,
  longRunDay: dayOfWeekSchema.optional(),
  longRideDay: dayOfWeekSchema.optional(),
  targetRaceDistance: z.enum(TRI_RACE_DISTANCES),
  targetRaceDate: z.string(),
});

export const generateTriPlanRequestSchema = z.object({
  runProfile: runProfileInputSchema,
  cyclingProfile: cyclistProfileInputSchema,
  swimProfile: swimmerProfileInputSchema,
  preferences: triPreferencesInputSchema,
});

export type GenerateTriPlanRequest = z.infer<typeof generateTriPlanRequestSchema>;
