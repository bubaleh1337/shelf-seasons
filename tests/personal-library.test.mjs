import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("personal library migration enables ownership RLS and private covers", async () => {
  const sql = await read("supabase/migrations/202609050002_personal_library.sql");
  assert.match(sql, /alter table public\.library_books enable row level security/i);
  assert.match(sql, /storage\.buckets[\s\S]*'book-covers'[\s\S]*false/i);
  assert.match(sql, /auth\.uid\(\)[\s\S]*user_id/i);
});

test("authenticated pages use the personal app and real library rows", async () => {
  const page = await read("app/[locale]/[[...slug]]/page.tsx");
  assert.match(page, /from\("library_books"\)/);
  assert.match(page, /<ShelfSeasonsApp/);
  assert.match(page, /if \(!isSupabaseConfigured\)[\s\S]*<ShelfSeasonsDemo/);
});

test("book routes derive ownership from the authenticated session", async () => {
  const createRoute = await read("app/api/books/route.ts");
  const updateRoute = await read("app/api/books/[bookId]/route.ts");
  assert.match(createRoute, /requireUser\(supabase\)/);
  assert.match(updateRoute, /\.eq\("user_id", userId\)/);
  assert.doesNotMatch(createRoute, /form\.get\("user_id"\)/);
});
