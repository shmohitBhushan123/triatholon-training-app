import { describe, it, expect } from 'vitest';
import {
  normalizeApiSport,
  formatPhaseLabel,
  formatDurationMinutes,
  metersToYards,
  toWorkoutCardData,
  type RawWorkoutRow,
} from './workout-view';

describe('normalizeApiSport', () => {
  // The API appends sport: 'cycling', but SportType (and the design) use
  // 'bike' — this is the one place that mismatch gets resolved.
  it.each([
    ['run', 'run'],
    ['cycling', 'bike'],
    ['swim', 'swim'],
  ] as const)('maps API sport %s to %s', (apiSport, expected) => {
    expect(normalizeApiSport(apiSport)).toBe(expected);
  });
});

describe('formatPhaseLabel', () => {
  // Confirms every TrainingPhase value (including 'maintenance', which only
  // appears for very short plans) has a display label — a missing case
  // here would be a compile error, but this locks in the actual copy.
  it.each([
    ['base', 'BASE'],
    ['build1', 'BUILD 1'],
    ['build2', 'BUILD 2'],
    ['race_prep', 'RACE PREP'],
    ['taper', 'TAPER'],
    ['maintenance', 'MAINTENANCE'],
  ] as const)('formats %s as %s', (phase, expected) => {
    expect(formatPhaseLabel(phase)).toBe(expected);
  });
});

describe('formatDurationMinutes', () => {
  // Under an hour renders as bare minutes with a prime symbol ("45'"),
  // matching the mocks' "4×8'" style; an hour or more switches to h:mm.
  it.each([
    [45, "45'"],
    [60, '1:00'],
    [70, '1:10'],
    [125, '2:05'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    expect(formatDurationMinutes(minutes)).toBe(expected);
  });
});

describe('metersToYards', () => {
  // Swim distance is stored in meters (converted from yards at plan
  // generation, see plan-engine/swim/workout-builder.ts) — this reverses
  // that conversion for display. Values here mirror that file's own tests
  // (1200yd/2400yd/800yd swim sets). Allows +/-1 yard: rounding to meters
  // and back isn't perfectly invertible for every input (e.g. 800yd rounds
  // to 732m, which converts back to 801y, not 800y) — a display rounding
  // artifact, not a bug worth chasing exactness for.
  it.each([
    [Math.round(1200 * 0.9144), 1200],
    [Math.round(2400 * 0.9144), 2400],
    [Math.round(800 * 0.9144), 800],
  ])('converts %i meters back to ~%iy', (meters, expectedYards) => {
    expect(metersToYards(meters)).toBeGreaterThanOrEqual(expectedYards - 1);
    expect(metersToYards(meters)).toBeLessThanOrEqual(expectedYards + 1);
  });
});

describe('toWorkoutCardData', () => {
  // Cycling: DURATION from target_duration_minutes, TARGET from the power
  // range (collapsing to a single value when min === max).
  it('builds a cycling view model with duration and a power range', () => {
    const row: RawWorkoutRow = {
      sport: 'cycling',
      workout_type: 'threshold',
      target_duration_minutes: 70,
      target_power_min_watts: 240,
      target_power_max_watts: 255,
      description: 'Ride 4x8min at 95-100% FTP with 4min easy between efforts.',
    };
    const result = toWorkoutCardData(row);
    expect(result.sport).toBe('bike');
    expect(result.title).toBe('Threshold Ride');
    expect(result.stats).toEqual([
      { label: 'DURATION', value: '1:10' },
      { label: 'TARGET', value: '240-255W' },
    ]);
    expect(result.description).toBe('Ride 4x8min at 95-100% FTP with 4min easy between efforts.');
  });

  it('collapses a power target to a single value when min equals max', () => {
    const row: RawWorkoutRow = {
      sport: 'cycling',
      workout_type: 'recovery',
      target_duration_minutes: 30,
      target_power_min_watts: 100,
      target_power_max_watts: 100,
      description: null,
    };
    expect(toWorkoutCardData(row).stats).toContainEqual({ label: 'TARGET', value: '100W' });
  });

  // Run: DISTANCE from target_distance_miles (already stored in miles, no
  // conversion needed), PACE from the min/mile range.
  it('builds a run view model with distance and a pace range', () => {
    const row: RawWorkoutRow = {
      sport: 'run',
      workout_type: 'tempo',
      target_distance_miles: 5,
      target_pace_min: '7:45',
      target_pace_max: '8:00',
      description: 'Tempo run at threshold effort.',
    };
    const result = toWorkoutCardData(row);
    expect(result.sport).toBe('run');
    expect(result.title).toBe('Tempo Run');
    expect(result.stats).toEqual([
      { label: 'DISTANCE', value: '5 mi' },
      { label: 'PACE', value: '7:45-8:00/mi' },
    ]);
  });

  // Swim: DISTANCE converted from stored meters back to yards, PACE per
  // 100 yards (matches the athlete's yard-based CSS benchmark).
  it('builds a swim view model with distance in yards and a pace range', () => {
    const row: RawWorkoutRow = {
      sport: 'swim',
      workout_type: 'aerobic',
      target_distance_meters: Math.round(2400 * 0.9144),
      target_pace_min: '1:50',
      target_pace_max: '2:00',
      description: 'Aerobic swim set.',
    };
    const result = toWorkoutCardData(row);
    expect(result.sport).toBe('swim');
    expect(result.title).toBe('Aerobic Swim');
    expect(result.stats).toEqual([
      { label: 'DISTANCE', value: '2400y' },
      { label: 'PACE', value: '1:50-2:00/100y' },
    ]);
  });

  // An unrecognized workout_type shouldn't crash the card — falls back to
  // a generic per-sport title rather than throwing or rendering "undefined".
  it.each([
    ['cycling', 'Ride'],
    ['run', 'Run'],
    ['swim', 'Swim'],
  ] as const)(
    'falls back to a generic %s title for an unknown workout_type',
    (sport, expectedTitle) => {
      const row = {
        sport,
        workout_type: 'not_a_real_type',
        description: null,
      } as unknown as RawWorkoutRow;
      expect(toWorkoutCardData(row).title).toBe(expectedTitle);
    }
  );

  // Missing target fields (e.g. a rest day placeholder row) should produce
  // an empty stats array rather than a stat with an "undefined" value.
  it('omits stats whose underlying fields are null', () => {
    const row: RawWorkoutRow = {
      sport: 'run',
      workout_type: 'rest',
      target_distance_miles: null,
      target_pace_min: null,
      target_pace_max: null,
      description: null,
    };
    expect(toWorkoutCardData(row).stats).toEqual([]);
  });
});
