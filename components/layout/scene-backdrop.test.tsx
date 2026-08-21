import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SceneBackdrop } from './scene-backdrop';

describe('SceneBackdrop', () => {
  it('renders its children', () => {
    render(
      <SceneBackdrop weekNumber={3}>
        <p>today&apos;s session</p>
      </SceneBackdrop>
    );
    expect(screen.getByText("today's session")).toBeInTheDocument();
  });

  it('renders the velora wordmark, always lowercase', () => {
    render(<SceneBackdrop weekNumber={null}>content</SceneBackdrop>);
    expect(screen.getByText('velora')).toBeInTheDocument();
  });

  // Testing Library's render() flushes effects synchronously (it wraps in
  // act()), so the mount effect has already run by the time these
  // assertions run — this confirms the effect actually sets a real time
  // label and includes the week number, not that it's absent pre-mount
  // (that instant isn't observable in this harness).
  it('shows the current time and week number once mounted', () => {
    render(<SceneBackdrop weekNumber={3}>content</SceneBackdrop>);
    expect(screen.getByText(/WK 3/)).toBeInTheDocument();
  });

  it('omits the week number when there is no active plan', () => {
    render(<SceneBackdrop weekNumber={null}>content</SceneBackdrop>);
    expect(screen.queryByText(/WK/)).not.toBeInTheDocument();
  });
});
