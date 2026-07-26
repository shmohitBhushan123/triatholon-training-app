// services/plan-engine/cycling/util.ts
// Pure helper functions for the cycling plan engine.
// No external dependencies — safe to import from any module in this directory.

// TSS (Training Stress Score) for a steady-state effort.
// Formula: (duration_hours × IF²) × 100
// where IF (Intensity Factor) = targetWatts / ftpWatts.
// For steady-state intervals, Normalized Power ≈ target watts.
export function calculateTSS(
  durationMinutes: number,
  targetWatts: number,
  ftpWatts: number
): number {
  const durationHours = durationMinutes / 60;
  const intensityFactor = targetWatts / ftpWatts;
  return Math.round(durationHours * intensityFactor ** 2 * 100);
}

// Converts a percentage of FTP to absolute watts, rounded to the nearest watt.
export function wattsFromPct(ftpWatts: number, pct: number): number {
  return Math.round((pct / 100) * ftpWatts);
}

// Whole weeks from today to the target event date (ceiling).
// Lives in the shared scheduling layer — re-exported here so imports within
// the cycling module stay local.
export { getWeeksToEvent } from '../schedule';
