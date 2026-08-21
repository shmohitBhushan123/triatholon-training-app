// lib/scene/scene.ts
// Time-of-day "scene" system for Home/Plan/Progress/Profile/Onboarding's
// shared sky backdrop (Design/design_handoff_home's `SCENES` object) — a
// day-cycle of 5 curated looks (sunrise/morning/day/sunset/night), each
// with its own sky gradient, ghost-mark color, shard color/opacity, header
// text color, and greeting. Pure and client-side: no backend involved.
//
// Colors/gradients are copied verbatim from the Home mock (final, per its
// README). The hour ranges that pick a scene are NOT specified anywhere in
// the handoff (the README only says "map new Date().getHours() to the 5
// scenes") — the boundaries below are my own reasonable assumption, roughly
// centered on each scene's example time in the mock (sunrise ~5:40am,
// morning ~8:15am, day ~12:40pm, sunset ~7:05pm, night ~10:30pm). Flag if
// the designer wants different cutoffs.

export type TimeScene = 'sunrise' | 'morning' | 'day' | 'sunset' | 'night';

export interface SceneConfig {
  greeting: string;
  sky: string;
  ghost: string;
  shard: string;
  shardOpacity1: number;
  shardOpacity2: number;
  foreground: string;
  textShadow: string;
}

export const SCENES: Record<TimeScene, SceneConfig> = {
  sunrise: {
    greeting: 'Good sunrise',
    sky: 'linear-gradient(180deg, oklch(0.86 0.015 235) 0%, oklch(0.66 0.025 235) 55%, oklch(0.4 0.02 240) 100%)',
    ghost: 'oklch(0.44 0.02 238 / 50%)',
    shard: 'oklch(0.5 0.08 12)',
    shardOpacity1: 0.9,
    shardOpacity2: 0.4,
    foreground: 'oklch(0.98 0.003 40)',
    textShadow: '0 1px 12px oklch(0.1 0 0 / 45%)',
  },
  morning: {
    greeting: 'Good morning',
    sky: 'linear-gradient(180deg, oklch(0.92 0.01 70) 0%, oklch(0.78 0.022 60) 55%, oklch(0.55 0.025 55) 100%)',
    ghost: 'oklch(0.6 0.025 60 / 45%)',
    shard: 'oklch(0.48 0.08 12)',
    shardOpacity1: 0.9,
    shardOpacity2: 0.35,
    foreground: 'oklch(0.22 0.015 60)',
    textShadow: 'none',
  },
  day: {
    greeting: 'Good afternoon',
    sky: 'linear-gradient(180deg, oklch(0.99 0.001 40) 0%, oklch(0.95 0.002 40) 55%, oklch(0.88 0.003 40) 100%)',
    ghost: 'oklch(0.9 0.003 40)',
    shard: 'oklch(0.62 0.08 12)',
    shardOpacity1: 0.85,
    shardOpacity2: 0.35,
    foreground: 'oklch(0.18 0.002 40)',
    textShadow: 'none',
  },
  sunset: {
    greeting: 'Good evening',
    sky: 'linear-gradient(180deg, oklch(0.58 0.035 255) 0%, oklch(0.4 0.025 250) 55%, oklch(0.2 0.012 260) 100%)',
    ghost: 'oklch(0.24 0.015 255 / 55%)',
    shard: 'oklch(0.74 0.08 12)',
    shardOpacity1: 0.9,
    shardOpacity2: 0.4,
    foreground: 'oklch(0.98 0.003 40)',
    textShadow: '0 1px 14px oklch(0.1 0 0 / 45%)',
  },
  night: {
    greeting: 'Good night',
    sky: 'linear-gradient(180deg, oklch(0.25 0.006 270) 0%, oklch(0.17 0.005 280) 55%, oklch(0.125 0.004 285) 100%)',
    ghost: 'oklch(0.16 0.005 280)',
    shard: 'oklch(0.62 0.08 12)',
    shardOpacity1: 0.55,
    shardOpacity2: 0.22,
    foreground: 'oklch(0.98 0.003 40)',
    textShadow: '0 1px 10px oklch(0.1 0 0 / 40%)',
  },
};

// Hour -> scene, using the boundaries documented above. Night wraps past
// midnight (21:00-4:59).
export function getTimeScene(date: Date = new Date()): TimeScene {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'sunrise';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'sunset';
  return 'night';
}

export function getSceneConfig(date: Date = new Date()): SceneConfig {
  return SCENES[getTimeScene(date)];
}
