import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { seasonFromDateKey, seasonSymbol } from "../lib/seasons.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("calendar months resolve to northern hemisphere seasons", () => {
  assert.equal(seasonFromDateKey("2026-03-01"), "spring");
  assert.equal(seasonFromDateKey("2026-07-10"), "summer");
  assert.equal(seasonFromDateKey("2026-10-31"), "autumn");
  assert.equal(seasonFromDateKey("2026-12-01"), "winter");
  assert.equal(seasonSymbol("autumn"), "🍂");
});

test("season and reading-language migration preserves ownership and history", async () => {
  const sql = await read("supabase/migrations/202609070004_seasons_and_languages.sql");
  assert.match(sql, /create type public\.book_season as enum \('spring', 'summer', 'autumn', 'winter'\)/i);
  assert.match(sql, /add column if not exists reading_language public\.reading_language not null default 'other'/i);
  assert.match(sql, /reading_runs[\s\S]*reading_language/i);
  assert.match(sql, /sync_active_run_language/i);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /current_user_id uuid := auth\.uid\(\)/i);
});

test("personal app exposes seasonal shelves, readable calendar titles and home add action", async () => {
  const source = await read("components/shelf-seasons-app.tsx");
  assert.match(source, /<SeasonalShelves/);
  assert.match(source, /calendar-book-chip/);
  assert.match(source, /<strong>\{book\.title\}<\/strong>/);
  assert.match(source, /PageIntro title=\{`\$\{c\.greeting\}/);
  assert.match(source, /action=\{<BookDialog locale=\{locale\} onSaved=\{onBookSaved\}/);
});

test("book search resolves translated titles and cover storage has provider fallback", async () => {
  const [searchRoute, bookServer, repairRoute] = await Promise.all([
    read("app/api/books/search/route.ts"),
    read("lib/books/server.ts"),
    read("app/api/books/repair-covers/route.ts"),
  ]);
  assert.match(searchRoute, /translatedTitleQueries/);
  assert.match(searchRoute, /"извлечение троих": "The Drawing of the Three"/);
  assert.match(searchRoute, /wbsearchentities/);
  assert.match(searchRoute, /wbgetentities/);
  assert.match(searchRoute, /extraLarge/);
  assert.match(bookServer, /resolveProviderCover/);
  assert.match(bookServer, /covers\.openlibrary\.org\/b\/isbn/);
  assert.match(repairRoute, /requireUser\(supabase\)/);
  assert.match(repairRoute, /\.eq\("user_id", userId\)/);
  assert.match(repairRoute, /storeRemoteCover/);
});

test("recaps include completed reading languages", async () => {
  const [route, component] = await Promise.all([
    read("app/api/recaps/route.ts"),
    read("components/recaps/recaps-page.tsx"),
  ]);
  assert.match(route, /languageCounts/);
  assert.match(route, /run\.readingLanguage === "ru"/);
  assert.match(component, /summary\.languageCounts\.en/);
});
