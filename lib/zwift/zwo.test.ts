import { describe, it, expect } from 'vitest';
import { generateZwo } from './zwo';
import type { ZwoWorkout } from '@/lib/schemas/zwift';

// ---------------------------------------------------------------------------
// generateZwo — block serialisation (table-driven)
// ---------------------------------------------------------------------------
// Each case is a single-block workout asserting the correct XML element name
// and attributes are present in the output.
// ---------------------------------------------------------------------------

describe('generateZwo — block serialisation', () => {
  const cases: Array<{
    name: string;
    workout: ZwoWorkout;
    expectedContains: string[];
  }> = [
    {
      name: 'Warmup block',
      workout: {
        name: 'Test',
        blocks: [{ type: 'Warmup', duration: 300, powerLow: 0.25, powerHigh: 0.75 }],
      },
      expectedContains: ['<Warmup', 'Duration="300"', 'PowerLow="0.25"', 'PowerHigh="0.75"'],
    },
    {
      name: 'Cooldown block',
      workout: {
        name: 'Test',
        blocks: [{ type: 'Cooldown', duration: 300, powerLow: 0.75, powerHigh: 0.25 }],
      },
      expectedContains: ['<Cooldown', 'Duration="300"', 'PowerLow="0.75"', 'PowerHigh="0.25"'],
    },
    {
      name: 'SteadyState block',
      workout: {
        name: 'Test',
        blocks: [{ type: 'SteadyState', duration: 1800, power: 0.75 }],
      },
      expectedContains: ['<SteadyState', 'Duration="1800"', 'Power="0.75"'],
    },
    {
      name: 'IntervalsT block',
      workout: {
        name: 'Test',
        blocks: [
          {
            type: 'IntervalsT',
            repeat: 5,
            onDuration: 180,
            offDuration: 90,
            onPower: 1.05,
            offPower: 0.55,
          },
        ],
      },
      expectedContains: [
        '<IntervalsT',
        'Repeat="5"',
        'OnDuration="180"',
        'OffDuration="90"',
        'OnPower="1.05"',
        'OffPower="0.55"',
      ],
    },
    {
      name: 'FreeRide block',
      workout: {
        name: 'Test',
        blocks: [{ type: 'FreeRide', duration: 600 }],
      },
      expectedContains: ['<FreeRide', 'Duration="600"', 'FlatRoad="1"'],
    },
  ];

  it.each(cases)('$name', ({ workout, expectedContains }) => {
    const xml = generateZwo(workout);
    for (const fragment of expectedContains) {
      expect(xml).toContain(fragment);
    }
  });
});

// ---------------------------------------------------------------------------
// generateZwo — document structure
// ---------------------------------------------------------------------------

describe('generateZwo — document structure', () => {
  const fullWorkout: ZwoWorkout = {
    name: 'Threshold Intervals',
    description: '5x3min at threshold with 90s recovery',
    blocks: [
      { type: 'Warmup', duration: 600, powerLow: 0.25, powerHigh: 0.75 },
      { type: 'SteadyState', duration: 300, power: 0.75 },
      {
        type: 'IntervalsT',
        repeat: 5,
        onDuration: 180,
        offDuration: 90,
        onPower: 1.05,
        offPower: 0.55,
      },
      { type: 'Cooldown', duration: 600, powerLow: 0.75, powerHigh: 0.25 },
    ],
  };

  it('wraps output in valid .zwo XML structure', () => {
    const xml = generateZwo(fullWorkout);

    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain('<workout_file>');
    expect(xml).toContain('</workout_file>');
    expect(xml).toContain('<name>Threshold Intervals</name>');
    expect(xml).toContain('<description>5x3min at threshold with 90s recovery</description>');
    expect(xml).toContain('<sportType>bike</sportType>');
    expect(xml).toContain('<workout>');
    expect(xml).toContain('</workout>');
  });

  it('uses empty description when not provided', () => {
    const xml = generateZwo({ name: 'Test', blocks: [{ type: 'FreeRide', duration: 300 }] });
    expect(xml).toContain('<description></description>');
  });
});
