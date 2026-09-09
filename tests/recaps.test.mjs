import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { longestStreakInPeriod, mostActiveWeek, periodBounds, recapSeriesCandidates, summarizeRecapMetrics, uniqueRecapBooks } from "../lib/recaps/period.ts";

const session = (id, readOn, pagesRead = null, minutesRead = null) => ({ id, runId: "run", bookId: "book", readOn, checkInOnly: pagesRead === null && minutesRead === null, endingPage: null, pagesRead, minutesRead, resultingPercent: null, note: null });

test("recap periods require canonical month and year starts", () => {
  assert.deepEqual(periodBounds("month", "2026-09-01"), { start: "2026-09-01", end: "2026-10-01" });
  assert.deepEqual(periodBounds("year", "2026-01-01"), { start: "2026-01-01", end: "2027-01-01" });
  assert.throws(() => periodBounds("month", "2026-09-02"));
});

test("recap metrics count unique days, details and the longest streak", () => {
  const sessions = [session("one", "2026-09-01", 20, 30), session("two", "2026-09-01", 5), session("three", "2026-09-02", null, 15), session("four", "2026-09-04")];
  const metrics = summarizeRecapMetrics(sessions);
  assert.equal(metrics.readingDays, 3);
  assert.equal(metrics.longestStreak, 2);
  assert.equal(metrics.pagesRead, 25);
  assert.equal(metrics.sessionsWithPages, 2);
  assert.equal(metrics.minutesRead, 45);
  assert.equal(longestStreakInPeriod([]), 0);
  assert.deepEqual(mostActiveWeek(sessions.map((item) => item.readOn)), { start: "2026-08-31", days: 3 });
});

test("only series with completed books in the period become recap choices", () => {
  const series = [{ id: "dark-tower", name: "The Dark Tower", entries: [{ bookId: "one" }, { bookId: "two" }, { bookId: null }] }, { id: "empty", name: "Empty", entries: [{ bookId: "three" }] }];
  assert.deepEqual(recapSeriesCandidates(series, ["one", "two"]), [{ id: "dark-tower", name: "The Dark Tower", completedInPeriod: 2, totalVolumes: 3 }]);
});

test("recap book grids and selections contain one card per library book", () => {
  const book = { id: "book-one", title: "One", authors: [] };
  const original = { runId: "original", book, finishedOn: "2026-09-01", isReread: false, rating: null, nomination: null };
  const accidentalRepeat = { runId: "duplicate", book, finishedOn: "2026-09-08", isReread: true, rating: null, nomination: null };
  assert.deepEqual(uniqueRecapBooks([accidentalRepeat, original]), [original]);
});

test("recap migration validates eligibility and isolates selections", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202609070002_recaps.sql", import.meta.url), "utf8");
  assert.match(sql, /alter table public\.recap_selections enable row level security/i);
  assert.match(sql, /foreign key \(run_id, user_id\)/i);
  assert.match(sql, /foreign key \(series_id, user_id\)/i);
  assert.match(sql, /create or replace function public\.validate_recap_selection/i);
  assert.match(sql, /run_not_eligible_for_recap/i);
  assert.match(sql, /series_not_eligible_for_recap/i);
});

test("recap routes derive ownership from the authenticated user and omit private notes", async () => {
  const [summary, selections] = await Promise.all([
    readFile(new URL("../app/api/recaps/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/recaps/selections/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(summary, /requireUser\(supabase\)/);
  assert.match(selections, /requireUser\(supabase\)/);
  assert.doesNotMatch(summary, /select\([^)]*(note|impression)/i);
  assert.doesNotMatch(selections, /userId.*request|user_id.*json/i);
});
