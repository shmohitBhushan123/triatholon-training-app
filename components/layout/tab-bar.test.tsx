import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

import { TabBar } from './tab-bar';

describe('TabBar', () => {
  // For each route, confirms the matching tab gets the active styling and
  // every other tab does not — i.e. exactly one tab is ever active.
  it.each([
    ['/', 'Today'],
    ['/plan', 'Plan'],
    ['/progress', 'Progress'],
    ['/profile', 'Profile'],
  ])('marks %s as active, highlighting the %s tab', (pathname, activeLabel) => {
    mockUsePathname.mockReturnValue(pathname);
    render(<TabBar />);

    const activeLink = screen.getByRole('link', { name: activeLabel });
    expect(activeLink).toHaveClass('font-semibold');

    const otherLabels = ['Today', 'Plan', 'Progress', 'Profile'].filter(
      (label) => label !== activeLabel
    );
    for (const label of otherLabels) {
      expect(screen.getByRole('link', { name: label })).not.toHaveClass('font-semibold');
    }
  });

  // Regression check: the shared href list matches TabBar's own TABS const,
  // so a typo'd route wouldn't silently 404 for real users.
  it('renders all four tabs with the correct hrefs', () => {
    mockUsePathname.mockReturnValue('/');
    render(<TabBar />);

    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Plan' })).toHaveAttribute('href', '/plan');
    expect(screen.getByRole('link', { name: 'Progress' })).toHaveAttribute('href', '/progress');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  });

  // '/' is a special case in the active-tab check (exact match, not
  // startsWith) — without it, every route would match Today's '/' prefix.
  it('does not treat "/" as active when on a nested route', () => {
    mockUsePathname.mockReturnValue('/plan');
    render(<TabBar />);

    expect(screen.getByRole('link', { name: 'Today' })).not.toHaveClass('font-semibold');
    expect(screen.getByRole('link', { name: 'Plan' })).toHaveClass('font-semibold');
  });
});
