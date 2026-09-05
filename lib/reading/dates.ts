import type { StreakSummary } from "@/lib/reading/types";

export function localDateKey(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function shiftDate(key: string, days: number) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calculateStreaks(readingDates: string[], today: string): StreakSummary {
  const dates = [...new Set(readingDates)].sort();
  const set = new Set(dates);
  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of dates) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  const start = set.has(today) ? today : set.has(shiftDate(today, -1)) ? shiftDate(today, -1) : null;
  let current = 0;
  let cursor = start;
  while (cursor && set.has(cursor)) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }
  return { current, longest };
}
