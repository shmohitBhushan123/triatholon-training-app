import { z } from 'zod';

// Zod schemas for Strava API responses.
// Validates the shape of external data at runtime before it touches the rest of the app.
// Add schemas here as the Strava integration is built out.

export const StravaTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number(),
  token_type: z.string(),
  athlete: z.object({
    id: z.number(),
    firstname: z.string(),
    lastname: z.string(),
  }),
});

export const StravaActivitySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  sport_type: z.string(),
  start_date: z.string(),
  elapsed_time: z.number(),
  distance: z.number(),
  moving_time: z.number(),
  average_heartrate: z.number().optional(),
  average_watts: z.number().optional(),
  map: z.object({ summary_polyline: z.string().nullable() }).optional(),
});

export const StravaActivitiesSchema = z.array(StravaActivitySchema);

export type StravaToken = z.infer<typeof StravaTokenSchema>;
export type StravaActivity = z.infer<typeof StravaActivitySchema>;
