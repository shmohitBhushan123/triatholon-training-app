import { z } from 'zod';
import { GOAL_TYPES } from '@/services/plan-engine/schedule';

// Building blocks shared across the four plan-request schemas (run, cycling,
// swim, tri). Each sport's schema imports what it needs from here rather than
// redefining the same primitives independently.

// A single day of the week: 0=Monday ... 6=Sunday.
export const dayOfWeekSchema = z.number().int().min(0).max(6);

export const trainingDaysSchema = z
  .array(dayOfWeekSchema)
  .min(1, 'At least one training day is required');

// Sourced from services/plan-engine/schedule.ts's GOAL_TYPES — the single
// source of truth also used by RunPreferences/CyclingPreferences/
// SwimPreferences' goalType field, so the two can never drift apart.
export const goalTypeSchema = z.enum(GOAL_TYPES);
