import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { moveSeriesEntry, summarizeSeries } from "../lib/series/progress.ts";

const entries = [
  { id: "one", seriesId: "series", bookId: "book-one", placeholderTitle: null, sortOrder: 1000, positionLabel: "1" },
  { id: "two", seriesId: "series", bookId: "book-two", placeholderTitle: null, sortOrder: 2000, positionLabel: "2" },
  { id: "future", seriesId: "series", bookId: null, placeholderTitle: "Future book", sortOrder: 3000, positionLabel: "3" },
];

const books = [
  { id: "book-one", status: "read" },
  { id: "book-two", status: "want" },
];

test("series progress counts read volumes and finds the next unread volume", () => {
  const summary = summarizeSeries(entries, books);
  assert.equal(summary.completed, 1);
  assert.equal(summary.total, 3);
  assert.equal(summary.nextEntry?.id, "two");
});

test("series ordering moves one entry without mutating the source", () => {
  const moved = moveSeriesEntry(entries, 1, -1);
  assert.deepEqual(moved.map((entry) => entry.id), ["two", "one", "future"]);
  assert.deepEqual(entries.map((entry) => entry.id), ["one", "two", "future"]);
  assert.equal(moveSeriesEntry(entries, 0, -1), entries);
});

test("series migration enforces ownership, ordering and one entry source", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202609070001_series.sql", import.meta.url), "utf8");
  assert.match(sql, /alter table public\.series enable row level security/i);
  assert.match(sql, /alter table public\.series_entries enable row level security/i);
  assert.match(sql, /foreign key \(series_id, user_id\)/i);
  assert.match(sql, /foreign key \(book_id, user_id\)/i);
  assert.match(sql, /series_entries_one_source check/i);
  assert.match(sql, /create or replace function public\.reorder_series_entries/i);
  assert.match(sql, /cardinality\(p_entry_ids\)/i);
});

test("series API derives ownership from the authenticated user", async () => {
  const routes = await Promise.all([
    readFile(new URL("../app/api/series/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/series/[seriesId]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/series/[seriesId]/entries/route.ts", import.meta.url), "utf8"),
  ]);
  for (const route of routes) {
    assert.match(route, /requireUser\(supabase\)/);
    assert.doesNotMatch(route, /userId.*request|user_id.*json/i);
  }
});
