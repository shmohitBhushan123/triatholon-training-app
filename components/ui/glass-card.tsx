import * as React from 'react';

import { cn } from '@/lib/utils';

// Frosted "glass" surface used on scene screens (Home, onboarding) where
// cards sit directly over a sky-gradient backdrop rather than the app's
// normal --card surface. Not a shadcn Card variant — see
// Design/design_handoff_home/README.md's "Design tokens & components"
// section for why this is a distinct surface with its own tokens
// (--glass-bg/--glass-border/--glass-foreground in app/globals.css).
//
// `cutCorner` applies the brand's signature angled top-right corner — per
// the style guide, at most one element per screen should use it (reserved
// for today's session card or the primary CTA).
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Background opacity step used across the mocks (40-52%, varies by card). */
  opacity?: 42 | 46 | 50;
  cutCorner?: boolean;
}

const OPACITY_CLASSES: Record<NonNullable<GlassCardProps['opacity']>, string> = {
  42: 'bg-(--glass-bg)/42',
  46: 'bg-(--glass-bg)/46',
  50: 'bg-(--glass-bg)/50',
};

export function GlassCard({
  className,
  opacity = 46,
  cutCorner = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-[1rem] border border-(--glass-border)/22 p-5 text-(--glass-foreground)',
        'shadow-[0_8px_32px_oklch(0.1_0_0/22%),inset_0_1px_0_oklch(1_0_0/16%)]',
        'backdrop-blur-[22px] backdrop-saturate-150',
        OPACITY_CLASSES[opacity],
        cutCorner &&
          'rounded-tl-[1rem] rounded-tr-none rounded-br-[1rem] rounded-bl-[1rem] [clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,0_100%)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
