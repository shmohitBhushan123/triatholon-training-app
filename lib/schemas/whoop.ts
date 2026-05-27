import { z } from 'zod';

// Zod schemas for Whoop API responses.
// Whoop returns many optional fields — Zod makes this explicit and safe.

export const WhoopRecoverySchema = z.object({
  cycle_id: z.number(),
  sleep_id: z.number(),
  user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  score_state: z.enum(['SCORED', 'PENDING_SLEEP', 'UNSCORABLE']),
  score: z
    .object({
      user_calibrating: z.boolean(),
      recovery_score: z.number(),
      resting_heart_rate: z.number(),
      hrv_rmssd_milli: z.number(),
      spo2_percentage: z.number().nullable(),
      skin_temp_celsius: z.number().nullable(),
    })
    .nullable(),
});

export const WhoopCycleSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  start: z.string(),
  end: z.string().nullable(),
  timezone_offset: z.string(),
  score_state: z.enum(['SCORED', 'PENDING_SLEEP', 'UNSCORABLE']),
  score: z
    .object({
      strain: z.number(),
      kilojoule: z.number(),
      average_heart_rate: z.number(),
      max_heart_rate: z.number(),
    })
    .nullable(),
});

export const WhoopTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

export type WhoopRecovery = z.infer<typeof WhoopRecoverySchema>;
export type WhoopCycle = z.infer<typeof WhoopCycleSchema>;
export type WhoopToken = z.infer<typeof WhoopTokenSchema>;
