import { z } from 'zod';

// Zod schemas for Garmin Connect data.
// Garmin has no official public API — data is fetched via the unofficial garmin-connect library.
// Schema shapes may need to evolve as the library's response format changes.

export const GarminActivitySchema = z.object({
  activityId: z.number(),
  activityName: z.string(),
  startTimeLocal: z.string(),
  activityType: z.object({
    typeKey: z.string(),
  }),
  distance: z.number().nullable(),
  duration: z.number(),
  averageHR: z.number().nullable(),
  maxHR: z.number().nullable(),
  averagePower: z.number().nullable(),
});

export const GarminActivitiesSchema = z.array(GarminActivitySchema);

export type GarminActivity = z.infer<typeof GarminActivitySchema>;
