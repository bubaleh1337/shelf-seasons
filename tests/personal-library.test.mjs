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

test("home library preview opens each book in the existing editor", async () => {
  const [app, copy, styles] = await Promise.all([
    read("components/shelf-seasons-app.tsx"),
    read("lib/app-copy.ts"),
    read("app/globals.css"),
  ]);

  assert.match(app, /className="home-book-card"/);
  assert.match(app, /<BookDialog locale=\{locale\} book=\{book\} onSaved=\{onBookSaved\}/);
  assert.match(app, /className="home-book-card-trigger"/);
  assert.match(app, /aria-label=\{c\.openBookDetails/);
  assert.match(copy, /openBookDetails: "Open details for/);
  assert.match(copy, /openBookDetails: "Открыть книгу/);
  assert.match(styles, /\.home-book-card-trigger \{ position: absolute; inset: 0;/);
  assert.match(styles, /\.home-book-card:focus-within/);
});
