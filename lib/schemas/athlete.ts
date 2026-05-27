import { z } from 'zod';

// Zod schemas for the athlete profile captured during onboarding.
// This is the core input to the plan generation engine.

export const AthleteProfileSchema = z.object({
  userId: z.string().uuid(),
  raceDate: z.string().datetime(),
  raceType: z.enum(['70.3', 'full']),
  weeklyHours: z.number().min(4).max(20),
  restDays: z
    .array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']))
    .min(1)
    .max(3),

  // Fitness benchmarks
  swimPacePer100y: z.number().positive(), // seconds per 100y
  bikeFtpWatts: z.number().positive(), // functional threshold power
  runPacePerMile: z.number().positive(), // seconds per mile from recent race

  // Gear (affects what sessions can be scheduled)
  hasSmartTrainer: z.boolean(),
  hasGpsWatch: z.boolean(),
  hasWhoopStrap: z.boolean(),
});

export type AthleteProfile = z.infer<typeof AthleteProfileSchema>;
