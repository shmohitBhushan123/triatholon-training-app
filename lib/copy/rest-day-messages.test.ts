import { describe, it, expect } from 'vitest';
import { getRestDayMessage, REST_DAY_MESSAGES } from './rest-day-messages';

describe('getRestDayMessage', () => {
  // Basic contract: whatever comes back must be one of the known messages,
  // not an empty string or an out-of-bounds array access.
  it('returns one of the known rest-day messages', () => {
    const message = getRestDayMessage(new Date('2026-08-11T12:00:00Z'));
    expect(REST_DAY_MESSAGES).toContain(message);
  });

  // The message must not change between page loads/refetches on the same
  // day, or the UI would flicker between different copy on every render.
  it('is stable for the same calendar day regardless of time of day', () => {
    const morning = getRestDayMessage(new Date('2026-08-11T06:00:00Z'));
    const night = getRestDayMessage(new Date('2026-08-11T23:00:00Z'));
    expect(morning).toBe(night);
  });

  // The whole point of a rotating set — confirms it isn't hardcoded to
  // always return the same message regardless of date.
  it('rotates on different days', () => {
    const day1 = getRestDayMessage(new Date('2026-01-01T12:00:00Z'));
    const day2 = getRestDayMessage(new Date('2026-01-02T12:00:00Z'));
    // Not guaranteed different for every pair of days globally, but with a
    // 6-message rotation adjacent days should differ.
    expect(day1).not.toBe(day2);
  });
});
