import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { selectCurrentBook } from "../lib/books/current.ts";

const baseBook = {
  authors: ["Stephen King"],
  coverUrl: null,
  createdAt: "2026-09-05T00:00:00Z",
  defaultCoverUrl: null,
  description: null,
  format: "print",
  isbn: null,
  pageCount: 300,
  publishedYear: 1991,
};

test("a read book is never presented as the current book", () => {
  const book = { ...baseBook, id: "read", status: "read", title: "The Waste Lands" };
  assert.equal(selectCurrentBook([book], []), null);
});

test("the most recently active reading book is selected", () => {
  const older = { ...baseBook, id: "older", status: "reading", title: "Older" };
  const recent = { ...baseBook, id: "recent", status: "reading", title: "Recent" };
  const sessions = [{ bookId: "recent" }, { bookId: "older" }];
  assert.equal(selectCurrentBook([older, recent], sessions)?.id, "recent");
});

test("status synchronization migration closes stale active runs", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202609050004_library_status_sync.sql", import.meta.url), "utf8");
  assert.match(sql, /create or replace function public\.set_library_book_status/i);
  assert.match(sql, /p_status = 'read'[\s\S]*status = 'completed'/i);
  assert.match(sql, /Repair runs left active by version 0\.5\.0/i);
});

test("Vercel deployment uses a deterministic Next.js build", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(config.framework, "nextjs");
  assert.equal(config.installCommand, "npm ci");
  assert.equal(config.buildCommand, "npm run build");
});
