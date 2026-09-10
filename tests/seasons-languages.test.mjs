import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { orderedSeasons, seasonFromDateKey, seasonSymbol } from "../lib/seasons.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("calendar months resolve to northern hemisphere seasons", () => {
  assert.equal(seasonFromDateKey("2026-03-01"), "spring");
  assert.equal(seasonFromDateKey("2026-07-10"), "summer");
  assert.equal(seasonFromDateKey("2026-10-31"), "autumn");
  assert.equal(seasonFromDateKey("2026-12-01"), "winter");
  assert.equal(seasonSymbol("autumn"), "🍂");
});

test("seasonal shelves always begin with the current season and continue chronologically", () => {
  assert.deepEqual(orderedSeasons("spring"), ["spring", "summer", "autumn", "winter"]);
  assert.deepEqual(orderedSeasons("summer"), ["summer", "autumn", "winter", "spring"]);
  assert.deepEqual(orderedSeasons("autumn"), ["autumn", "winter", "spring", "summer"]);
  assert.deepEqual(orderedSeasons("winter"), ["winter", "spring", "summer", "autumn"]);
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
  const [source, shelves, wallpaper, css] = await Promise.all([
    read("components/shelf-seasons-app.tsx"),
    read("components/library/seasonal-shelves.tsx"),
    read("components/seasonal/seasonal-art.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(source, /<SeasonalShelves/);
  assert.match(source, /<SeasonalPageBackdrop/);
  assert.match(source, /calendar-book-chip/);
  assert.match(source, /<strong>\{book\.title\}<\/strong>/);
  assert.match(source, /PageIntro title=\{`\$\{c\.greeting\}/);
  assert.match(source, /action=\{<BookDialog locale=\{locale\} onSaved=\{onBookSaved\}/);
  assert.match(shelves, /orderedSeasons\(currentSeason\)/);
  assert.match(shelves, /DialogTrigger asChild/);
  assert.match(shelves, /shelf-book-spine/);
  assert.match(shelves, /<ShelfOrnaments season=\{season\}/);
  assert.match(wallpaper, /seasonal-backdrop/);
  assert.match(wallpaper, /seasonal-paper-texture/);
  assert.match(wallpaper, /seasonal-cozy-vignette/);
  assert.match(wallpaper, /vignette-pumpkins/);
  assert.match(wallpaper, /vignette-sunflower/);
  assert.match(wallpaper, /vignette-blossom/);
  assert.match(wallpaper, /vignette-tree/);
  assert.doesNotMatch(css, /\.shelf-main::before\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /\.seasonal-backdrop\s*\{[^}]*position:\s*absolute/);
  assert.doesNotMatch(wallpaper, /seasonal-garland/);
  assert.doesNotMatch(css, /\.seasonal-garland/);
  assert.match(css, /\.seasonal-cozy-vignette\s*\{[^}]*bottom:\s*76px/);
  assert.doesNotMatch(css, /\.seasonal-(?:backdrop|wallpaper|cozy-vignette)\s*\{[^}]*position:\s*fixed/);
});

test("book titles use a readable surface below each cover", async () => {
  const [source, css] = await Promise.all([
    read("components/shelf-seasons-app.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(source, /className="simple-book-meta"/);
  assert.match(css, /\.simple-book-meta\s*\{[^}]*background:/);
  assert.match(css, /\.simple-book-meta\s*\{[^}]*backdrop-filter:\s*blur\(8px\)/);
});

test("book editing keeps an unchanged status from creating another completed run", async () => {
  const route = await read("app/api/books/[bookId]/route.ts");
  assert.match(route, /\(status \?\? "want"\) === current\.status/);
  assert.match(route, /unchangedStatusRow/);
});

test("cover picker is localized instead of exposing native browser text", async () => {
  const [dialog, copy] = await Promise.all([
    read("components/library/book-dialog.tsx"),
    read("lib/app-copy.ts"),
  ]);
  assert.match(dialog, /localized-file-input/);
  assert.match(dialog, /c\.chooseCover/);
  assert.match(dialog, /c\.noCoverChosen/);
  assert.match(copy, /chooseCover: "Выбрать обложку"/);
  assert.match(copy, /noCoverChosen: "Файл не выбран\."/);
});

test("book search resolves translated titles and cover storage has provider fallback", async () => {
  const [searchRoute, searchDomain, bookServer, repairRoute, googleAdapter] = await Promise.all([
    read("app/api/books/search/route.ts"),
    read("lib/books/search.ts"),
    read("lib/books/server.ts"),
    read("app/api/books/repair-covers/route.ts"),
    read("lib/books/google.ts"),
  ]);
  assert.match(searchRoute, /translatedTitleQueries/);
  assert.match(searchDomain, /"извлечение троих": "The Drawing of the Three"/);
  assert.match(searchRoute, /wbsearchentities/);
  assert.match(searchRoute, /wbgetentities/);
  assert.match(searchRoute, /extraLarge/);
  assert.match(searchRoute, /identifyGoogleBooksRequest\(url\)/);
  assert.match(searchRoute, /slice\(0, 2\)/);
  assert.match(googleAdapter, /process\.env\.GOOGLE_BOOKS_API_KEY/);
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
