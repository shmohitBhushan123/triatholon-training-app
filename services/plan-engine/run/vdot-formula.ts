import type { VdotPaceConfig } from './types';

const MILE_M = 1609.344;

// VO2-velocity quadratic coefficients (Daniels & Gilbert, 1979):
//   VO2 = C0 + C1*v + C2*v^2   (v in m/min, VO2 in mL/kg/min)
const C0 = -4.6;
const C1 = 0.182258;
const C2 = 0.000104;

// Per-zone intensity as a fraction of VDOT, calibrated from the table.
const INTENSITY = {
  easyMax: 0.63, // slow end of the easy range
  easyMin: 0.733, // fast end of the easy range
  marathon: 0.818,
  tempo: 0.881,
  interval: 0.974, // reference intensity for I-pace (calibrated on the Km/1000m column)
} as const;

// R-pace velocity is a fixed ratio above I-pace velocity — not a separate
// %VDOT intensity. Calibrated from the table's genuinely-correct R200m/R300m
// columns (ratios of 1.0999 and 1.0947 respectively — nearly identical,
// confirming R-pace is one velocity target) and validated against real book
// R400m values not present in the old table (see module header).
const R_VELOCITY_RATIO = 1.0973;

// Daniels does not meaningfully prescribe I-pace below VDOT 37.
const MIN_VDOT_FOR_INTERVAL = 37;

// R-pace distance gating — simplified thresholds, not an exact reproduction
// of the book's own (slightly non-monotonic) per-cell gating. R800m is never
// populated in the source table at any VDOT — 800m is too long to be a
// meaningful "R" (fast rep) distance — so it is always null here too.
const MIN_VDOT_FOR_REP300 = 31;
const MIN_VDOT_FOR_REP400 = 35;
const MIN_VDOT_FOR_REP600 = 34;

// Solves VO2(v) = targetVO2 for velocity v (positive root of the quadratic).
function velocityForVO2(targetVO2: number): number {
  // C2*v^2 + C1*v + (C0 - targetVO2) = 0
  const a = C2;
  const b = C1;
  const c = C0 - targetVO2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

// Velocity (m/min) an athlete of this VDOT sustains at the given intensity.
function velocityAtIntensity(vdot: number, intensity: number): number {
  return velocityForVO2(intensity * vdot);
}

// Formats a per-mile pace (seconds) as 'M:SS'.
function fmtPace(secPerMile: number): string {
  const total = Math.round(secPerMile);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Formats a rep/split time (seconds) as 'M:SS' — same format, different meaning.
function fmtTime(sec: number): string {
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function pacePerMile(vdot: number, intensity: number): string {
  const v = velocityAtIntensity(vdot, intensity); // m/min
  return fmtPace((MILE_M / v) * 60); // sec per mile
}

// Split time for a rep distance at a given velocity (m/min).
function repTime(distanceM: number, velocity: number): string {
  return fmtTime((distanceM / velocity) * 60);
}

export function computePaceConfig(vdot: number): VdotPaceConfig {
  const iVelocity = velocityAtIntensity(vdot, INTENSITY.interval); // m/min

  // I-pace field stores the 1000m rep time (Daniels' "Km" column under I).
  const interval400m = vdot >= MIN_VDOT_FOR_INTERVAL ? repTime(1000, iVelocity) : null;

  // Single R-pace velocity, applied to every rep distance.
  const rVelocity = iVelocity * R_VELOCITY_RATIO;

  return {
    easyMinPace: pacePerMile(vdot, INTENSITY.easyMin),
    easyMaxPace: pacePerMile(vdot, INTENSITY.easyMax),
    marathonPace: pacePerMile(vdot, INTENSITY.marathon),
    tempoPace: pacePerMile(vdot, INTENSITY.tempo),
    interval400m,
    rep200m: repTime(200, rVelocity),
    rep300m: vdot >= MIN_VDOT_FOR_REP300 ? repTime(300, rVelocity) : null,
    rep400m: vdot >= MIN_VDOT_FOR_REP400 ? repTime(400, rVelocity) : null,
    rep600m: vdot >= MIN_VDOT_FOR_REP600 ? repTime(600, rVelocity) : null,
    rep800m: null, // not meaningfully prescribed as an "R" (fast rep) distance
  };
}
