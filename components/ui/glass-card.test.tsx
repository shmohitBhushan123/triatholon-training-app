import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassCard } from './glass-card';

describe('GlassCard', () => {
  // Sanity check that children actually render inside the glass wrapper.
  it('renders its children', () => {
    render(<GlassCard>Recovery 72%</GlassCard>);
    expect(screen.getByText('Recovery 72%')).toBeInTheDocument();
  });

  // Each mock uses a different glass opacity (40-52%, per the Home README) —
  // confirms the `opacity` prop maps to the right Tailwind class for each.
  it.each([
    [42, 'bg-(--glass-bg)/42'],
    [46, 'bg-(--glass-bg)/46'],
    [50, 'bg-(--glass-bg)/50'],
  ] as const)('applies the %i opacity class', (opacity, expectedClass) => {
    render(<GlassCard opacity={opacity}>content</GlassCard>);
    expect(screen.getByText('content')).toHaveClass(expectedClass);
  });

  it('defaults to 46% opacity when none is given', () => {
    render(<GlassCard>content</GlassCard>);
    expect(screen.getByText('content')).toHaveClass('bg-(--glass-bg)/46');
  });

  // The shard cut-corner treatment is reserved for one card per screen — this
  // confirms the prop actually toggles it (clip-path + asymmetric radius) and
  // that the default shape stays a plain rounded rectangle otherwise.
  it.each([
    [true, 'rounded-tr-none'],
    [false, 'rounded-[1rem]'],
  ])('cutCorner=%s toggles the shard clip-path treatment', (cutCorner, expectedClass) => {
    render(<GlassCard cutCorner={cutCorner}>content</GlassCard>);
    const el = screen.getByText('content');
    if (cutCorner) {
      expect(el).toHaveClass(expectedClass);
      expect(el.className).toContain('clip-path');
    } else {
      expect(el).not.toHaveClass('rounded-tr-none');
    }
  });

  // Guards against a common cn()/twMerge regression where a caller's
  // className accidentally replaces the defaults instead of merging with them.
  it('merges a caller-provided className without dropping the defaults', () => {
    render(<GlassCard className="mt-4">content</GlassCard>);
    const el = screen.getByText('content');
    expect(el).toHaveClass('mt-4');
    expect(el).toHaveClass('bg-(--glass-bg)/46');
  });
});
