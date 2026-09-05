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

test("book covers render a persistent fallback and recover from image errors", async () => {
  const component = await readFile(new URL("../components/library/book-cover.tsx", import.meta.url), "utf8");
  assert.match(component, /personal-cover-fallback/);
  assert.match(component, /onError=\{\(\) => setFailed\(true\)\}/);
});
