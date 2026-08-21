import * as React from 'react';

import type { SportType } from '@/types';
import type { WorkoutStat } from '@/lib/workouts/workout-view';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';
import { SportTag } from '@/components/workout/sport-tag';

// The core "what do I do today" unit — shown on Home (today's session,
// stacked for brick days) and Plan (selected day's session). Presentational
// only: callers pass already-shaped data (see lib/workouts/workout-view.ts
// for turning a raw workout row into `title`/`stats`/`description`).
//
// `cutCorner` is the brand's one-per-screen shard treatment — reserved for
// today's session specifically, never every card in a list (e.g. Plan's
// week view should only cut today's card, not every day's).
export interface WorkoutCardProps {
  sport: SportType;
  title: string;
  /** Small mono meta line above the title, e.g. "TODAY · BUILD" or "MON · BUILD". */
  meta: string;
  stats: WorkoutStat[];
  description?: string | null;
  cutCorner?: boolean;
  /** Action buttons (e.g. "Start workout", ".zwo"), rendered below the stats. */
  actions?: React.ReactNode;
  className?: string;
}

export function WorkoutCard({
  sport,
  title,
  meta,
  stats,
  description,
  cutCorner = false,
  actions,
  className,
}: WorkoutCardProps) {
  return (
    <GlassCard
      data-testid="workout-card"
      opacity={50}
      cutCorner={cutCorner}
      className={cn('flex flex-col gap-4', className)}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <SportTag sport={sport} />
          <span className="font-mono text-[10px] text-(--glass-foreground)/65">{meta}</span>
        </div>
        <span className="text-lg font-semibold">{title}</span>
      </div>

      {stats.length > 0 && (
        <div className="flex gap-6 font-mono">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <span className="text-lg">{stat.value}</span>
              <span className="text-[10px] text-(--glass-foreground)/60">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {description && (
        <p className="line-clamp-2 text-sm text-(--glass-foreground)/80">{description}</p>
      )}

      {actions && <div className="flex gap-2.5">{actions}</div>}
    </GlassCard>
  );
}
