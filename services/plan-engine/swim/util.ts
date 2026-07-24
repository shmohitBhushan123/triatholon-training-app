// services/plan-engine/swim/util.ts
// Pure helper functions for the swim plan engine.
// No external dependencies — safe to import from any module in this directory.
//
// CSS (Critical Swim Speed) zones — offsets from CSS pace in seconds per 100yd:
//   Aerobic:   CSS + 15s or slower   (easy aerobic base building)
//   Threshold: CSS ± 5s              (race-pace work for triathlon swims)
//   Speed:     CSS - 5s or faster    (short reps, sprint work)
//
// Example at CSS = 115s/100yd (1:55/100yd):
//   Aerobic:   ≥ 130s (2:10/100yd or slower)
//   Threshold: 110–120s (1:50–2:00/100yd)
//   Speed:     ≤ 110s (1:50/100yd or faster)

export type CssZone = 'aerobic' | 'threshold' | 'speed';

export interface CssZoneBounds {
  name: string;
  zone: CssZone;
  // Pace in seconds per 100yd. minSecPer100yd is the faster (lower) bound.
  // null means unbounded in that direction.
  minSecPer100yd: number | null; // fastest pace for this zone (lower = faster)
  maxSecPer100yd: number | null; // slowest pace for this zone; null = no limit
}

// Derives CSS zone pace bounds from the athlete's CSS in seconds per 100yd.
// Returns snapshotable pace range strings at plan generation time.
export function getCssZoneBounds(cssPer100ydSeconds: number, zone: CssZone): CssZoneBounds {
  switch (zone) {
    case 'aerobic':
      return {
        name: 'Aerobic',
        zone,
        minSecPer100yd: cssPer100ydSeconds + 15,
        maxSecPer100yd: null, // no upper limit — just swim easy
      };
    case 'threshold':
      return {
        name: 'Threshold',
        zone,
        minSecPer100yd: cssPer100ydSeconds - 5,
        maxSecPer100yd: cssPer100ydSeconds + 5,
      };
    case 'speed':
      return {
        name: 'Speed',
        zone,
        minSecPer100yd: null, // no lower limit — as fast as possible for the rep
        maxSecPer100yd: cssPer100ydSeconds - 5,
      };
  }
}

// Formats a pace in seconds per 100yd as a 'M:SS' string.
// e.g. 115 -> '1:55', 130 -> '2:10', 90 -> '1:30'
export function formatPaceSec(secondsPer100yd: number): string {
  const m = Math.floor(secondsPer100yd / 60);
  const s = Math.round(secondsPer100yd % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Converts yards to meters (1 yard = 0.9144 metres), rounded to the nearest metre.
export function yardsToMeters(yards: number): number {
  return Math.round(yards * 0.9144);
}

// Converts a weekly hour budget for swimming into a yard target using the
// athlete's CSS pace: yards = hours * 3600 (sec/hr) / css (sec/100yd) * 100.
// Used by the tri plan orchestrator to translate an hour-based sport split
// into swim's native yard-based volume.
export function swimHoursToYards(hours: number, cssPer100ydSeconds: number): number {
  return Math.round(((hours * 3600) / cssPer100ydSeconds) * 100);
}

// Converts a weekly yard volume back into hours using CSS pace — the inverse
// of swimHoursToYards. Used when aggregating the swim leg into an hour-based
// weekly summary (e.g. TriPlanWeek.swimHours).
export function swimYardsToHours(yards: number, cssPer100ydSeconds: number): number {
  return ((yards / 100) * cssPer100ydSeconds) / 3600;
}

// Whole weeks from today to the target event date (ceiling).
// Re-exported from the shared scheduling layer — same function used by all sports.
export { getWeeksToEvent } from '../schedule';
