'use client';

import { useEffect, useState } from 'react';

import { SCENES, getSceneConfig } from '@/lib/scene/scene';

// The shared sky backdrop + header/greeting for Home/Plan/Progress/Profile
// (and Onboarding, minus the header) — see Design/design_handoff_home's
// README "Design tokens & components" section. `children` (the actual page
// content: recovery card, workout card(s), etc.) is rendered by the caller
// as a Server Component and passed straight through — none of that content
// needs client-side JS, only the scene/time-of-day bit does.
//
// Scene defaults to 'day' and the time label starts blank until `mounted`
// flips true. This is deliberate: `new Date()` reflects the *server's*
// clock/timezone during the initial server-rendered pass, which is wrong
// for an athlete's local time-of-day greeting — deriving the real values
// only once mounted in the browser avoids both an incorrect greeting and a
// React hydration mismatch warning.
export interface SceneBackdropProps {
  weekNumber: number | null;
  children: React.ReactNode;
}

export function SceneBackdrop({ weekNumber, children }: SceneBackdropProps) {
  // "Have we mounted in the browser yet" — the standard, deliberate pattern
  // for deferring browser-only values (here: the athlete's real local time)
  // until after hydration. eslint's react-hooks/set-state-in-effect rule
  // flags any setState-in-effect on principle, but this specific one-time
  // mount flag is exactly the sanctioned escape hatch for this problem —
  // there's no prop/render-time input to derive "are we on the client yet"
  // from, so it can't be rewritten as plain derived state.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate mount flag, see comment above
  useEffect(() => setMounted(true), []);

  const now = new Date();
  const scene = mounted ? getSceneConfig(now) : SCENES.day;
  const timeLabel = mounted
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(now)
    : null;

  return (
    <div
      className="relative flex min-h-full flex-col overflow-hidden"
      style={{ background: scene.sky }}
    >
      {/* Ghosted v anchor — large, low-opacity brand mark, bottom-left */}
      <svg
        viewBox="0 0 100 100"
        width={420}
        height={420}
        aria-hidden
        className="pointer-events-none absolute -bottom-[140px] -left-[110px] transition-colors duration-1000"
        style={{ color: scene.ghost }}
      >
        <polygon fill="currentColor" points="16,20 31,20 50,55.8 57.3,42 75.5,36 50,84" />
      </svg>

      {/* Drifting shards */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[10%] right-[10%] motion-safe:animate-[drift1_18s_ease-in-out_infinite]">
          <svg viewBox="60 5 35 30" width={80} height={69}>
            <polygon
              points="64.3,31 82.5,25 91,9 76,9"
              className="transition-[fill,opacity] duration-1000"
              style={{ fill: scene.shard, opacity: scene.shardOpacity1 }}
            />
          </svg>
        </div>
        <div className="absolute top-[44%] left-[8%] motion-safe:animate-[drift2_24s_ease-in-out_infinite]">
          <svg viewBox="60 5 35 30" width={44} height={38}>
            <polygon
              points="64.3,31 82.5,25 91,9 76,9"
              className="transition-[fill,opacity] duration-1000"
              style={{ fill: scene.shard, opacity: scene.shardOpacity2 }}
            />
          </svg>
        </div>
      </div>

      {/* Scrim — keeps glass cards legible over any sky color */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.1 0 0 / 18%) 0%, oklch(0.1 0 0 / 6%) 40%, oklch(0.1 0 0 / 22%) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pt-14 pb-28">
        <div
          className="flex items-center justify-between"
          style={{ color: scene.foreground, textShadow: scene.textShadow }}
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 100 100" width="24" height="24" fill="currentColor" aria-hidden>
              <polygon points="12,22 32,22 50,53.3 60,36 82,32 50,88" />
              <polygon points="66,22 88,18 94,8 74,8" fill="oklch(0.66 0.08 12)" />
            </svg>
            <span className="text-[15px] font-semibold tracking-wide">velora</span>
          </div>
          {timeLabel && (
            <span className="font-mono text-[11px] opacity-80">
              {timeLabel}
              {weekNumber !== null ? ` · WK ${weekNumber}` : ''}
            </span>
          )}
        </div>

        <div className="py-3" style={{ color: scene.foreground, textShadow: scene.textShadow }}>
          <span className="text-[27px] font-semibold tracking-tight">{scene.greeting}</span>
        </div>

        {children}
      </div>
    </div>
  );
}
