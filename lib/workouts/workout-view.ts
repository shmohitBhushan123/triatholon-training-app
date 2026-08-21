import type { SportType } from '@/types';
import type { TrainingPhase } from '@/services/plan-engine';

// Normalizes a raw workout row — exactly what /api/workouts/today and
// /api/plans/current return (a straight `select('*')` from
// run_workouts/cycling_workouts/swim_workouts, each with `sport` appended
// by the route) — into what WorkoutCard actually renders: a title and a
// small set of short labeled stats (DURATION/DISTANCE/PACE/TARGET).
//
// Each sport stores different columns (cycling: watts + minutes; run:
// miles + pace; swim: meters + pace-per-100yd) — this is the one place
// that difference gets resolved, so WorkoutCard itself stays sport-agnostic.
//
// Deviation from the Home mock worth flagging: the mock shows a 3rd stat
// ("4×8'" INTERVALS) that isn't backed by any stored column — workouts only
// have a free-text `description`, not structured interval data. Rather than
// fabricating a parser for text that isn't guaranteed to follow any pattern,
// `description` is surfaced separately (see WorkoutCardData.description)
// for the card to render as a text line, not crammed into the stats grid.

// The API route appends sport: 'run' | 'cycling' | 'swim' — but SportType
// (and the design) use 'bike', not 'cycling'. Normalize once, here, so
// nothing downstream needs to know about the API's naming.
export function normalizeApiSport(apiSport: 'run' | 'cycling' | 'swim'): SportType {
  return apiSport === 'cycling' ? 'bike' : apiSport;
}

// Uses services/plan-engine's TrainingPhase (snake_case, includes
// 'maintenance') since that's what's actually persisted to the DB — not
// types/index.ts's TrainingPhase, which uses a different, stale casing
// ('race-prep', no 'maintenance') that doesn't match the migrations' check
// constraints. Worth reconciling those two types at some point.
const PHASE_LABEL: Record<TrainingPhase, string> = {
  base: 'BASE',
  build1: 'BUILD 1',
  build2: 'BUILD 2',
  race_prep: 'RACE PREP',
  taper: 'TAPER',
  maintenance: 'MAINTENANCE',
};

export function formatPhaseLabel(phase: TrainingPhase): string {
  return PHASE_LABEL[phase];
}

export interface WorkoutStat {
  label: string;
  value: string;
}

export interface WorkoutCardData {
  sport: SportType;
  title: string;
  stats: WorkoutStat[];
  description: string | null;
}

// minutes -> "1:10" (h:mm) once over an hour, or "45'" under an hour —
// matches the mono "1:10" / "4×8'" style used throughout the mocks.
export function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}` : `${mins}'`;
}

// Swim distance is stored in meters (converted from yards at generation
// time, see services/plan-engine/swim/workout-builder.ts) but the athlete's
// swim benchmarks/UI are yard-based — convert back for display.
export function metersToYards(meters: number): number {
  return Math.round(meters / 0.9144);
}

const CYCLING_TITLES: Record<string, string> = {
  recovery: 'Recovery Ride',
  endurance: 'Endurance Ride',
  sweet_spot: 'Sweet Spot Ride',
  threshold: 'Threshold Ride',
  vo2max: 'VO2 Max Ride',
  long: 'Long Ride',
};

const RUN_TITLES: Record<string, string> = {
  easy: 'Easy Run',
  tempo: 'Tempo Run',
  interval: 'Interval Run',
  long: 'Long Run',
  rest: 'Rest Day',
};

const SWIM_TITLES: Record<string, string> = {
  aerobic: 'Aerobic Swim',
  threshold: 'Threshold Swim',
  speed: 'Speed Swim',
  rest: 'Rest Day',
};

// Raw row shapes, as returned by supabase's `select('*')` — snake_case,
// matching the actual DB columns (see supabase/migrations/), not the
// camelCase CyclingWorkout/RunWorkout/SwimWorkout app-layer types.
export interface RawCyclingWorkoutRow {
  sport: 'cycling';
  workout_type: string;
  target_duration_minutes: number | null;
  target_power_min_watts: number | null;
  target_power_max_watts: number | null;
  description: string | null;
}

export interface RawRunWorkoutRow {
  sport: 'run';
  workout_type: string;
  target_distance_miles: number | null;
  target_pace_min: string | null;
  target_pace_max: string | null;
  description: string | null;
}

export interface RawSwimWorkoutRow {
  sport: 'swim';
  workout_type: string;
  target_distance_meters: number | null;
  target_pace_min: string | null;
  target_pace_max: string | null;
  description: string | null;
}

export type RawWorkoutRow = RawCyclingWorkoutRow | RawRunWorkoutRow | RawSwimWorkoutRow;

export function toWorkoutCardData(row: RawWorkoutRow): WorkoutCardData {
  switch (row.sport) {
    case 'cycling':
      return buildCyclingWorkoutCardData(row);
    case 'run':
      return buildRunWorkoutCardData(row);
    case 'swim':
      return buildSwimWorkoutCardData(row);
  }
}
// DURATION from target_duration_minutes, TARGET from the power range
// (collapsing to a single value when min === max, e.g. a steady endurance
// ride rather than a ramp).
function buildCyclingWorkoutCardData(row: RawCyclingWorkoutRow): WorkoutCardData {
  const stats: WorkoutStat[] = [];
  if (row.target_duration_minutes != null) {
    stats.push({
      label: 'DURATION',
      value: formatDurationMinutes(row.target_duration_minutes),
    });
  }
  if (row.target_power_min_watts != null && row.target_power_max_watts != null) {
    const value =
      row.target_power_min_watts === row.target_power_max_watts
        ? `${row.target_power_min_watts}W`
        : `${row.target_power_min_watts}-${row.target_power_max_watts}W`;
    stats.push({ label: 'TARGET', value });
  }
  return {
    sport: 'bike',
    title: CYCLING_TITLES[row.workout_type] ?? 'Ride',
    stats,
    description: row.description,
  };
}

// DISTANCE from target_distance_miles (already stored in miles, no
// conversion needed), PACE from the min/mile range.
function buildRunWorkoutCardData(row: RawRunWorkoutRow): WorkoutCardData {
  const stats: WorkoutStat[] = [];
  if (row.target_distance_miles != null) {
    stats.push({ label: 'DISTANCE', value: `${row.target_distance_miles} mi` });
  }
  if (row.target_pace_min && row.target_pace_max) {
    stats.push({ label: 'PACE', value: `${row.target_pace_min}-${row.target_pace_max}/mi` });
  }
  return {
    sport: 'run',
    title: RUN_TITLES[row.workout_type] ?? 'Run',
    stats,
    description: row.description,
  };
}

// DISTANCE converted from stored meters back to yards, PACE per 100 yards
// (matches the athlete's yard-based CSS benchmark).
function buildSwimWorkoutCardData(row: RawSwimWorkoutRow): WorkoutCardData {
  const stats: WorkoutStat[] = [];
  if (row.target_distance_meters != null) {
    stats.push({ label: 'DISTANCE', value: `${metersToYards(row.target_distance_meters)}y` });
  }
  if (row.target_pace_min && row.target_pace_max) {
    stats.push({
      label: 'PACE',
      value: `${row.target_pace_min}-${row.target_pace_max}/100y`,
    });
  }
  return {
    sport: 'swim',
    title: SWIM_TITLES[row.workout_type] ?? 'Swim',
    stats,
    description: row.description,
  };
}
