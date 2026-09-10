import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateGoalProgress, selectGoalRuns } from "../lib/reading/goals.ts";

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

test("goal breakdown uses the same runs as the displayed total", () => {
  const runs = [
    { ...baseRun, id: "earlier", isReread: false, finishedOn: "2026-01-02" },
    { ...baseRun, id: "latest", isReread: true, finishedOn: "2026-09-06" },
    { ...baseRun, id: "other-year", isReread: false, finishedOn: "2025-12-31" },
  ];
  const goal = { year: 2026, targetBooks: 12, includeRereads: true };
  const selected = selectGoalRuns(runs, goal);
  assert.deepEqual(selected.map((run) => run.id), ["latest", "earlier"]);
  assert.equal(calculateGoalProgress(runs, goal), selected.length);
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

test("the yearly goal exposes every counted run with bilingual context", async () => {
  const [card, copy, removeRoute] = await Promise.all([
    readFile(new URL("../components/reading/yearly-goal-card.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/app-copy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/reading/runs/[runId]/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(card, /selectGoalRuns/);
  assert.match(card, /countedRuns\.map/);
  assert.match(card, /LibraryBookCover book=\{book\} compact/);
  assert.match(card, /goal-reread-badge/);
  assert.match(copy, /View goal/);
  assert.match(copy, /Посмотреть цель/);
  assert.match(removeRoute, /requireUser/);
  assert.match(removeRoute, /eq\("user_id", userId\)/);
  assert.match(removeRoute, /!run\.is_reread/);
  assert.match(removeRoute, /count < 2/);
});

test("a completed book exposes an explicit reread action", async () => {
  const [dialog, cover, copy] = await Promise.all([
    readFile(new URL("../components/library/book-dialog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/library/book-cover.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/app-copy.ts", import.meta.url), "utf8"),
  ]);
  assert.match(dialog, /async function startReread/);
  assert.match(dialog, /book\?\.status === "read"/);
  assert.match(dialog, /body: JSON\.stringify\(\{ status: "reading" \}\)/);
  assert.match(dialog, /startRereadConfirm/);
  assert.match(cover, /compact \? \{ width: 36/);
  assert.match(copy, /Start rereading/);
  assert.match(copy, /Начать перечитывание/);
});

test("yearly goal actions use short bilingual labels and stack on phones", async () => {
  const [card, copy, css] = await Promise.all([
    readFile(new URL("../components/reading/yearly-goal-card.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/app-copy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(card, /\{c\.viewGoalReads\}/);
  assert.doesNotMatch(card, /viewGoalReads\.replace/);
  assert.match(copy, /viewGoalReads: "View goal"/);
  assert.match(copy, /viewGoalReads: "Посмотреть цель"/);
  assert.match(css, /@media \(max-width: 560px\)[^}]*[\s\S]*?\.goal-card-actions \{[^}]*grid-template-columns: 1fr;/);
});
