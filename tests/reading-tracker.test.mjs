import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateStreaks } from "../lib/reading/dates.ts";

test("current streak keeps yesterday active until today ends", () => {
  assert.deepEqual(
    calculateStreaks(["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"], "2026-09-05"),
    { current: 4, longest: 4 },
  );
});

test("current and longest streaks handle gaps and duplicate sessions", () => {
  assert.deepEqual(
    calculateStreaks(["2026-08-20", "2026-08-21", "2026-08-22", "2026-09-04", "2026-09-05", "2026-09-05"], "2026-09-05"),
    { current: 2, longest: 3 },
  );
});

test("streak becomes zero when neither today nor yesterday qualifies", () => {
  assert.deepEqual(calculateStreaks(["2026-09-01", "2026-09-02"], "2026-09-05"), { current: 0, longest: 2 });
});

test("reading migration protects runs and sessions and exposes trusted logging", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202609050003_reading_tracker.sql", import.meta.url), "utf8");
  assert.match(sql, /alter table public\.reading_runs enable row level security/i);
  assert.match(sql, /alter table public\.reading_sessions enable row level security/i);
  assert.match(sql, /security definer[\s\S]*auth\.uid\(\)/i);
  assert.match(sql, /future_reading_date/i);
});

test("current-page migration calculates progress and stores an absolute bookmark", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202609090001_reading_progress_and_recap_deduplication.sql", import.meta.url), "utf8");
  assert.match(sql, /add column if not exists ending_page integer/i);
  assert.match(sql, /calculated_percent := least\(100, round\(p_pages_read::numeric \* 100 \/ book_pages, 1\)\)/i);
  assert.match(sql, /pages_delta := p_pages_read - previous_page/i);
  assert.match(sql, /current_position = case when p_pages_read is not null then p_pages_read/i);
  assert.doesNotMatch(sql, /delete from public\.reading_runs/i);
});

test("reading form asks for the current page and never asks for a manual percent", async () => {
  const [dialog, copy] = await Promise.all([
    readFile(new URL("../components/reading/reading-dialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/app-copy.ts", import.meta.url), "utf8"),
  ]);
  assert.match(dialog, /c\.currentPage/);
  assert.match(dialog, /calculated-reading-progress/);
  assert.doesNotMatch(dialog, /percentAfter|setResultingPercent/);
  assert.match(copy, /currentPage: "Текущая страница"/);
});

test("book covers render a persistent fallback and recover from image errors", async () => {
  const component = await readFile(new URL("../components/library/book-cover.tsx", import.meta.url), "utf8");
  assert.match(component, /personal-cover-fallback/);
  assert.match(component, /onError=\{\(\) => setFailed\(true\)\}/);
});
