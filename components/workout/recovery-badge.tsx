import { RECOVERY_RECOMMENDATION, type RecoveryStatus } from '@/services/recovery';
import { cn } from '@/lib/utils';

// Recovery status pill (EXECUTE/MODIFY/SKIP) shown on the Home recovery
// card. Unlike SportTag, this one *is* a pill — per the style guide, pills
// are reserved exclusively for recovery states.
//
// Glass-tuned color pairs (bg alpha + darkened text) so the pill stays
// legible on the light glass surfaces used across Home/Plan/Progress/
// Profile. Only the EXECUTE (green) pair comes from an explicit value in
// the Home mock (Design/design_handoff_home) — MODIFY/SKIP aren't shown on
// glass anywhere in the handoff, so their text color here is derived using
// the same darkening applied to EXECUTE (roughly halve the --success/
// --warning/--destructive token's lightness, keep hue/chroma, bump
// background alpha from the style guide's flat-card 15% to 22%). Flag for
// a real value if/when the designer specs MODIFY/SKIP on glass directly.
export interface RecoveryBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: RecoveryStatus;
}

const STATUS_CLASSES: Record<RecoveryStatus, string> = {
  green: 'bg-[oklch(0.72_0.15_150/22%)] text-[oklch(0.36_0.13_150)]',
  yellow: 'bg-[oklch(0.8_0.14_85/22%)] text-[oklch(0.4_0.14_85)]',
  red: 'bg-[oklch(0.704_0.191_22.216/22%)] text-[oklch(0.35_0.19_22)]',
};

export function RecoveryBadge({ status, className, ...props }: RecoveryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wider',
        STATUS_CLASSES[status],
        className
      )}
      {...props}
    >
      {RECOVERY_RECOMMENDATION[status]}
    </span>
  );
}
