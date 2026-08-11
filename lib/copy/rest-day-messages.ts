// lib/rest-day-messages.ts
// Copy shown on the Home screen when there's no session scheduled today
// (a planned rest day, or no active plan at all). A small rotating set
// rather than one static string, but stable for a given calendar day so it
// doesn't change every time the page refetches.

export const REST_DAY_MESSAGES = [
  'Enjoy the day off 🎉',
  'Rest is training too — recharge 🔋',
  'No session today. Put your feet up 🛋️',
  'Recovery day. Your legs will thank you 🙌',
  'Nothing planned — go enjoy it ☀️',
  'Off day. Stretch, sleep, repeat 😴',
] as const;

// Deterministic pick based on the calendar day, so the message is stable
// across re-renders/refetches within the same day but still rotates daily.
export function getRestDayMessage(date: Date = new Date()): string {
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      86_400_000
  );
  return REST_DAY_MESSAGES[dayOfYear % REST_DAY_MESSAGES.length];
}
