import type { SportType } from '@/types';
import { cn } from '@/lib/utils';

// Small badge labeling which sport a workout belongs to (SWIM/BIKE/RUN),
// shown on the workout card. Per the style guide: monochrome rose-gold,
// square-ish corners (never a pill — pills are reserved for recovery
// badges), never per-sport colors.
//
// Colors here are tuned for the glass surfaces (Home/Plan/Progress/Profile
// all use GlassCard per their handoff READMEs) — not a shared token since
// nothing else in the app currently needs this exact rose-gold-on-glass tint.
export interface SportTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  sport: SportType;
}

const SPORT_LABEL: Record<SportType, string> = {
  swim: 'SWIM',
  bike: 'BIKE',
  run: 'RUN',
  brick: 'BRICK',
};

export function SportTag({ sport, className, ...props }: SportTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wider',
        sport === 'brick'
          ? 'bg-(--glass-foreground)/8 text-(--glass-foreground)/85'
          : 'bg-[oklch(0.66_0.08_12/30%)] text-[oklch(0.4_0.1_12)]',
        className
      )}
      {...props}
    >
      {SPORT_LABEL[sport]}
    </span>
  );
}
