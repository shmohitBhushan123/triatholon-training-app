// services/plan-engine/run/utils.ts
// Pure helper functions for the run plan engine.
// No external dependencies — safe to import from any module in this directory.

// Parses 'M:SS' or 'MM:SS' into decimal minutes.
export function parseTimeToMinutes(mmss: string): number {
  const [m, s] = mmss.split(':').map(Number);
  return m + s / 60;
}

// Formats decimal minutes as 'M:SS'.
export function formatMinPerMile(decimalMinutes: number): string {
  const m = Math.floor(decimalMinutes);
  const s = Math.round((decimalMinutes - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Converts a duration and a pace string ('MM:SS' min/mile) to a distance in meters.
export function minutesToMeters(durationMinutes: number, paceMinPerMile: string): number {
  const pace = parseTimeToMinutes(paceMinPerMile);
  return Math.round((durationMinutes / pace) * 1609.344);
}

// Derives interval pace (min/mile) from VdotPaceConfig.interval400m.
// NOTE: Despite the field name, interval400m stores the 1000m rep time from
// Daniels' Table 5.2 (e.g. '4:12' for VDOT 46 = 1000m in 4:12 = ~6:45/mile).
// TODO: rename VdotPaceConfig.interval400m -> interval1000m and update vdot-table.ts.
export function deriveIntervalPaceMinPerMile(interval400m: string): string {
  const repMinutes = parseTimeToMinutes(interval400m);
  const speedMPerMin = 1000 / repMinutes;
  return formatMinPerMile(1609.344 / speedMPerMin);
}

// Whole weeks from today to the target race date (ceiling).
export function getWeeksToRace(targetRaceDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(targetRaceDate);
  race.setHours(0, 0, 0, 0);
  const diffMs = race.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
}
