import { describe, it, expect } from 'vitest';
import { getTimeScene, getSceneConfig, SCENES } from './scene';

// Builds a Date at a given hour, minute unused — only the hour boundary
// matters for scene selection.
function atHour(hour: number): Date {
  const date = new Date('2026-08-12T00:00:00');
  date.setHours(hour, 0, 0, 0);
  return date;
}

describe('getTimeScene', () => {
  // Covers every boundary hour, not just a representative mid-range hour —
  // this is where an off-by-one in the range checks would actually show up.
  it.each([
    [4, 'night'],
    [5, 'sunrise'],
    [7, 'sunrise'],
    [8, 'morning'],
    [11, 'morning'],
    [12, 'day'],
    [16, 'day'],
    [17, 'sunset'],
    [20, 'sunset'],
    [21, 'night'],
    [23, 'night'],
    [0, 'night'],
  ] as const)('maps hour %i to %s', (hour, expectedScene) => {
    expect(getTimeScene(atHour(hour))).toBe(expectedScene);
  });
});

describe('getSceneConfig', () => {
  // Confirms the lookup actually returns the matching scene's config, not
  // just that a config of *some* shape comes back.
  it.each([
    [6, 'sunrise'],
    [9, 'morning'],
    [14, 'day'],
    [18, 'sunset'],
    [22, 'night'],
  ] as const)('returns the %s scene config at hour %i', (hour, expectedScene) => {
    expect(getSceneConfig(atHour(hour))).toBe(SCENES[expectedScene]);
  });

  // Every scene must have a non-empty greeting — a missing/blank greeting
  // would silently render an empty header on Home.
  it.each(Object.keys(SCENES) as (keyof typeof SCENES)[])(
    'the %s scene has a non-empty greeting',
    (scene) => {
      expect(SCENES[scene].greeting.length).toBeGreaterThan(0);
    }
  );
});
