import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecoveryBadge } from './recovery-badge';
import { RECOVERY_RECOMMENDATION } from '@/services/recovery';

describe('RecoveryBadge', () => {
  // Each recovery status must show its matching recommendation label —
  // this is the same score->status->recommendation chain tested in
  // services/recovery, but confirms the component actually renders it.
  it.each([
    ['green', 'EXECUTE'],
    ['yellow', 'MODIFY'],
    ['red', 'SKIP'],
  ] as const)('renders %s status as %s', (status, expectedLabel) => {
    render(<RecoveryBadge status={status} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  // Each status gets its own distinct color pair (success/warning/
  // destructive-derived) — guards against two statuses accidentally
  // sharing a class due to a copy-paste error in the lookup table.
  it.each([
    ['green', 'bg-[oklch(0.72_0.15_150/22%)]'],
    ['yellow', 'bg-[oklch(0.8_0.14_85/22%)]'],
    ['red', 'bg-[oklch(0.704_0.191_22.216/22%)]'],
  ] as const)('applies a distinct background for %s', (status, expectedClass) => {
    render(<RecoveryBadge status={status} />);
    const badge = screen.getByText(RECOVERY_RECOMMENDATION[status]);
    expect(badge).toHaveClass(expectedClass);
  });

  it('renders as a pill (rounded-full), unlike SportTag', () => {
    render(<RecoveryBadge status="green" />);
    expect(screen.getByText('EXECUTE')).toHaveClass('rounded-full');
  });

  it('merges a caller-provided className without dropping the defaults', () => {
    render(<RecoveryBadge status="green" className="ml-2" />);
    const badge = screen.getByText('EXECUTE');
    expect(badge).toHaveClass('ml-2');
    expect(badge).toHaveClass('rounded-full');
  });
});
