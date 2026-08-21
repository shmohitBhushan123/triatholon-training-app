import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SportTag } from './sport-tag';

describe('SportTag', () => {
  // Confirms each SportType renders its expected uppercase label — the
  // display label is a fixed lookup, not a derived/formatted string, so a
  // typo here would be silent (no TS error) without this test.
  it.each([
    ['swim', 'SWIM'],
    ['bike', 'BIKE'],
    ['run', 'RUN'],
    ['brick', 'BRICK'],
  ] as const)('renders %s as %s', (sport, expectedLabel) => {
    render(<SportTag sport={sport} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  // Brick is deliberately neutral/monochrome-grey rather than rose-gold —
  // it's not a single sport, so it shouldn't look like one.
  it('styles brick differently from single-sport tags', () => {
    render(<SportTag sport="brick" />);
    const brickTag = screen.getByText('BRICK');
    expect(brickTag).toHaveClass('bg-(--glass-foreground)/8');
    expect(brickTag).not.toHaveClass('bg-[oklch(0.66_0.08_12/30%)]');
  });

  // SWIM/BIKE/RUN all share the same rose-gold treatment — per the style
  // guide's "never per-sport colors" rule.
  it.each(['swim', 'bike', 'run'] as const)(
    'applies the same monochrome rose-gold styling to %s',
    (sport) => {
      render(<SportTag sport={sport} />);
      const tag = screen.getByText(sport.toUpperCase());
      expect(tag).toHaveClass('bg-[oklch(0.66_0.08_12/30%)]');
      expect(tag).toHaveClass('text-[oklch(0.4_0.1_12)]');
    }
  );

  it('merges a caller-provided className without dropping the defaults', () => {
    render(<SportTag sport="bike" className="ml-2" />);
    const tag = screen.getByText('BIKE');
    expect(tag).toHaveClass('ml-2');
    expect(tag).toHaveClass('rounded-md');
  });
});
