// services/plan-engine/run/vdot.ts
// VDOT-based running pace zone calculations.
//
// VDOT is a proxy for VO2max derived from a race performance, popularised by
// Jack Daniels in "Daniels' Running Formula". Each integer VDOT value maps to
// a set of training paces across 5 zones: Easy (E), Marathon (M), Tempo (T),
// Interval (I), and Repetition (R).
//
// Pace values are computed at call time from the underlying physiological
// model (see vdot-formula.ts) rather than looked up from a static table copied
// from the source book. Pace values are in min/mile (mm:ss format).

import type { VdotPaceConfig } from './types';
import { computePaceConfig } from './vdot-formula';

// Race distances supported as seed inputs, in meters.
const SEED_DISTANCE_METERS: Record<string, number> = {
  '1500m': 1500,
  mile: 1609.344,
  '3000m': 3000,
  '5k': 5000,
  '10k': 10000,
  half_marathon: 21097.5,
  marathon: 42195,
};

// Derives an athlete's VDOT from a race performance using the Daniels-Gilbert
// formula (Daniels & Gilbert, 1979). Returns the nearest integer VDOT, which
// is passed directly to computePaceConfig.
//
// Formula:
//   velocity      = distance_meters / time_minutes          (m/min)
//   % VO2max      = 0.8 + 0.1894393·e^(−0.012778·T)
//                       + 0.2989558·e^(−0.1932605·T)        (race intensity)
//   VO2 at pace   = −4.60 + 0.182258·v + 0.000104·v²       (mL/kg/min)
//   VDOT          = VO2 / % VO2max
//
// Reference: Daniels, J. (2014). Daniels' Running Formula (3rd ed.), ch. 2.
export function deriveVdot(seedDistance: string, seedTimeSeconds: number): number {
  const distanceMeters = SEED_DISTANCE_METERS[seedDistance];
  if (distanceMeters === undefined) {
    throw new Error(
      `Unsupported seed distance: "${seedDistance}". ` +
        `Supported values: ${Object.keys(SEED_DISTANCE_METERS).join(', ')}`
    );
  }

  const time = seedTimeSeconds / 60; // time in minutes
  const velocity = distanceMeters / time; // velocity in m/min

  // VO2 = -4.60 + 0.182258 * velocity + 0.000104 * velocity²
  const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity ** 2;

  // %VO2max = 0.8 +
  // 0.1894393 * e^(-0.012778 * t) +
  // 0.2989558 * e^(-0.1932605 * t)
  const pctVO2max =
    0.8 + 0.1894393 * Math.exp(-0.012778 * time) + 0.2989558 * Math.exp(-0.1932605 * time);

  // VDOT = VO2 / %VO2max
  return Math.round(vo2 / pctVO2max);
}

// Returns the pace config for a given VDOT, computed from the Daniels-Gilbert
// physiological model. Throws if the VDOT value is outside the supported
// range (30–85).
export function getPaceConfig(vdot: number): VdotPaceConfig {
  if (vdot < 30 || vdot > 85) {
    throw new Error(`VDOT out of range: ${vdot}. Supported range: 30–85.`);
  }
  return computePaceConfig(vdot);
}
