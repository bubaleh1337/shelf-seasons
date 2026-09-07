import type { ReadingRun, ReadingSession, YearlyGoal } from "@/lib/reading/types";
import type { BookSeries } from "@/lib/series/types";
import type { RecapPeriodType, RecapSeriesCandidate } from "@/lib/recaps/types";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function periodBounds(periodType: RecapPeriodType, periodStart: string) {
  if (!datePattern.test(periodStart)) throw new Error("invalid_period_start");
  const parsed = new Date(`${periodStart}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== periodStart) throw new Error("invalid_period_start");
  if (periodType === "month" && periodStart.slice(8) !== "01") throw new Error("invalid_month_start");
  if (periodType === "year" && periodStart.slice(5) !== "01-01") throw new Error("invalid_year_start");
  const end = new Date(parsed);
  if (periodType === "month") end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCFullYear(end.getUTCFullYear() + 1);
  return { start: periodStart, end: end.toISOString().slice(0, 10) };
}

export function currentPeriodStart(periodType: RecapPeriodType, today: string) {
  return periodType === "month" ? `${today.slice(0, 7)}-01` : `${today.slice(0, 4)}-01-01`;
}

export function shiftPeriod(periodType: RecapPeriodType, periodStart: string, amount: number) {
  const date = new Date(`${periodStart}T00:00:00Z`);
  if (periodType === "month") date.setUTCMonth(date.getUTCMonth() + amount);
  else date.setUTCFullYear(date.getUTCFullYear() + amount);
  return date.toISOString().slice(0, 10);
}

export function longestStreakInPeriod(readingDates: string[]) {
  const dates = [...new Set(readingDates)].sort();
  let longest = 0;
  let current = 0;
  let previous: string | null = null;
  for (const date of dates) {
    current = previous && shiftDate(previous, 1) === date ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  }
  return longest;
}

function mondayOf(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date.toISOString().slice(0, 10);
}

export function mostActiveWeek(readingDates: string[]) {
  const weekDates = new Map<string, Set<string>>();
  for (const date of new Set(readingDates)) {
    const week = mondayOf(date);
    weekDates.set(week, new Set([...(weekDates.get(week) ?? []), date]));
  }
  return [...weekDates.entries()].reduce<{ start: string | null; days: number }>((best, [start, dates]) =>
    dates.size > best.days || (dates.size === best.days && (!best.start || start < best.start)) ? { start, days: dates.size } : best,
  { start: null, days: 0 });
}

export function summarizeRecapMetrics(sessions: ReadingSession[]) {
  const readingDates = sessions.map((session) => session.readOn);
  const pages = sessions.flatMap((session) => session.pagesRead === null ? [] : [session.pagesRead]);
  const minutes = sessions.flatMap((session) => session.minutesRead === null ? [] : [session.minutesRead]);
  const activeWeek = mostActiveWeek(readingDates);
  return {
    readingDays: new Set(readingDates).size,
    longestStreak: longestStreakInPeriod(readingDates),
    pagesRead: pages.reduce((sum, value) => sum + value, 0),
    sessionsWithPages: pages.length,
    minutesRead: minutes.reduce((sum, value) => sum + value, 0),
    sessionsWithMinutes: minutes.length,
    mostActiveWeekStart: activeWeek.start,
    mostActiveWeekDays: activeWeek.days,
  };
}

export function recapGoalProgress(runs: ReadingRun[], goal: YearlyGoal | null) {
  if (!goal) return null;
  const completed = runs.filter((run) => run.status === "completed" && (!run.isReread || goal.includeRereads)).length;
  return { target: goal.targetBooks, completed, includeRereads: goal.includeRereads };
}

export function recapSeriesCandidates(series: BookSeries[], completedBookIds: string[]): RecapSeriesCandidate[] {
  const completed = new Set(completedBookIds);
  return series.flatMap((item) => {
    const completedInPeriod = item.entries.filter((entry) => entry.bookId && completed.has(entry.bookId)).length;
    return completedInPeriod ? [{ id: item.id, name: item.name, completedInPeriod, totalVolumes: item.entries.length }] : [];
  }).sort((a, b) => b.completedInPeriod - a.completedInPeriod || a.name.localeCompare(b.name));
}
