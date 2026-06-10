import { z } from 'zod';

export const WorkoutBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('Warmup'),
    duration: z.number().positive(),
    powerLow: z.number().positive(),
    powerHigh: z.number().positive(),
  }),
  z.object({
    type: z.literal('Cooldown'),
    duration: z.number().positive(),
    powerLow: z.number().positive(),
    powerHigh: z.number().positive(),
  }),
  z.object({
    type: z.literal('SteadyState'),
    duration: z.number().positive(),
    power: z.number().positive(),
  }),
  z.object({
    type: z.literal('IntervalsT'),
    repeat: z.number().int().positive(),
    onDuration: z.number().positive(),
    offDuration: z.number().positive(),
    onPower: z.number().positive(),
    offPower: z.number().positive(),
  }),
  z.object({
    type: z.literal('FreeRide'),
    duration: z.number().positive(),
  }),
]);

export const ZwoWorkoutSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  blocks: z.array(WorkoutBlockSchema).min(1),
});

export type WorkoutBlock = z.infer<typeof WorkoutBlockSchema>;
export type ZwoWorkout = z.infer<typeof ZwoWorkoutSchema>;
