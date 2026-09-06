import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateGoalProgress } from "../lib/reading/goals.ts";

const baseRun = {
  bookId: "book",
  currentPosition: null,
  finishedOn: "2026-09-06",
  impression: null,
  nomination: null,
  rating: null,
  startedOn: "2026-09-01",
  status: "completed",
  totalUnits: null,
};

test("yearly goal counts completed runs in the selected year", () => {
  const runs = [
    { ...baseRun, id: "one", isReread: false },
    { ...baseRun, id: "two", isReread: true },
    { ...baseRun, id: "old", isReread: false, finishedOn: "2025-12-31" },
    { ...baseRun, id: "active", isReread: false, status: "reading", finishedOn: null },
  ];
  assert.equal(calculateGoalProgress(runs, { year: 2026, targetBooks: 12, includeRereads: true }), 2);
});

test("yearly goal can exclude rereads", () => {
  const runs = [
    { ...baseRun, id: "one", isReread: false },
    { ...baseRun, id: "two", isReread: true },
  ];
  assert.equal(calculateGoalProgress(runs, { year: 2026, targetBooks: 12, includeRereads: false }), 1);
  assert.equal(calculateGoalProgress(runs, null), 0);
});

test("completion migration validates ratings, owns nominations, and is idempotent", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202609060001_completion_and_goals.sql", import.meta.url), "utf8");
  assert.match(sql, /rating between 0\.5 and 5/i);
  assert.match(sql, /foreign key \(run_id, user_id\)/i);
  assert.match(sql, /alter table public\.run_nominations enable row level security/i);
  assert.match(sql, /create or replace function public\.finish_reading_run/i);
  assert.match(sql, /if selected_run\.id is null then[\s\S]*status = 'completed'/i);
  assert.match(sql, /p_status = 'read'[\s\S]*insert into public\.reading_runs/i);
});

test("completion and goal interfaces use authenticated application routes", async () => {
  const [finish, goal, app] = await Promise.all([
    readFile(new URL("../app/api/reading/finish/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/goals/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/shelf-seasons-app.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(finish, /requireUser/);
  assert.match(finish, /finish_reading_run/);
  assert.match(goal, /eq\("user_id", userId\)|user_id: userId/);
  assert.match(app, /FinishBookDialog/);
  assert.match(app, /YearlyGoalCard/);
});
