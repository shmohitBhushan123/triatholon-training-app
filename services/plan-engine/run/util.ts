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
// NOTE: Despite the field name, interval400m stores the 1000m rep time
// (Daniels' "Km" column under I-pace) — e.g. '4:12' for VDOT 46 = 1000m in
// 4:12 = ~6:45/mile. See vdot-formula.ts for the derivation.
// TODO: rename VdotPaceConfig.interval400m -> interval1000m.
export function deriveIntervalPaceMinPerMile(interval400m: string): string {
  const repMinutes = parseTimeToMinutes(interval400m);
  const speedMPerMin = 1000 / repMinutes;
  return formatMinPerMile(1609.344 / speedMPerMin);
}
