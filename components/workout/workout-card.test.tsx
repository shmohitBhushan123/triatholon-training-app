import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkoutCard } from './workout-card';

const baseProps = {
  sport: 'bike' as const,
  title: 'Threshold Ride',
  meta: 'TODAY · BUILD',
  stats: [
    { label: 'DURATION', value: '1:10' },
    { label: 'TARGET', value: '240-255W' },
  ],
};

describe('WorkoutCard', () => {
  it('renders the sport tag, meta, and title', () => {
    render(<WorkoutCard {...baseProps} />);
    expect(screen.getByText('BIKE')).toBeInTheDocument();
    expect(screen.getByText('TODAY · BUILD')).toBeInTheDocument();
    expect(screen.getByText('Threshold Ride')).toBeInTheDocument();
  });

  // Each stat renders as a value + label pair — confirms both parts of
  // every stat show up, not just the values.
  it.each(baseProps.stats)('renders the $label stat as $value', ({ label, value }) => {
    render(<WorkoutCard {...baseProps} />);
    expect(screen.getByText(value)).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  // An empty stats array (e.g. a rest-day placeholder) shouldn't render an
  // empty stats row at all.
  it('renders no stats row when stats is empty', () => {
    render(<WorkoutCard {...baseProps} stats={[]} />);
    expect(screen.queryByText('DURATION')).not.toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<WorkoutCard {...baseProps} description="Ride at threshold effort." />);
    expect(screen.getByText('Ride at threshold effort.')).toBeInTheDocument();
  });

  it('renders no description paragraph when none is given', () => {
    render(<WorkoutCard {...baseProps} />);
    expect(screen.queryByText(/effort/)).not.toBeInTheDocument();
  });

  it('renders provided actions', () => {
    render(<WorkoutCard {...baseProps} actions={<button>Start workout</button>} />);
    expect(screen.getByRole('button', { name: 'Start workout' })).toBeInTheDocument();
  });

  // The shard cut-corner is reserved for the one hero card per screen —
  // confirms the prop actually toggles the clip-path treatment.
  it.each([
    [true, true],
    [false, false],
  ])('cutCorner=%s applies the clip-path treatment: %s', (cutCorner, expectApplied) => {
    render(<WorkoutCard {...baseProps} cutCorner={cutCorner} />);
    const card = screen.getByTestId('workout-card');
    expect(card.className.includes('clip-path')).toBe(expectApplied);
  });
});
