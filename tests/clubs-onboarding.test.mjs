import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("a club read stores only privacy-safe book metadata selected by its organizer", async () => {
  const route = await read("app/api/clubs/[clubId]/reads/route.ts");
  assert.match(route, /eq\("user_id", userId\)/);
  assert.match(route, /page_count,format,reading_language,cover_url/);
  assert.match(route, /books\.googleusercontent\.com/);
  assert.doesNotMatch(route, /book\.description|book\.cover_path|season:\s*book\.season/);
});

test("the club detail offers personal edition defaults but no private notes", async () => {
  const route = await read("app/api/clubs/[clubId]/route.ts");
  assert.match(route, /format: read\.format/);
  assert.match(route, /pageCount: read\.page_count/);
  assert.match(route, /coverUrl: read\.cover_url/);
  assert.doesNotMatch(route, /read\.description|read\.cover_path|reading_sessions/);
});

test("member onboarding reuses the existing full book editor and has no arbitrary book selector", async () => {
  const clubs = await read("components/clubs/clubs-page.tsx");
  const bookEditor = await read("components/library/book-dialog.tsx");
  assert.match(clubs, /<BookDialog locale=\{locale\} prefill=\{prefill\}/);
  assert.match(clubs, /onSaved=\{onClubBookSaved\}/);
  assert.match(clubs, /recommendedBook/);
  assert.doesNotMatch(clubs, /<select id="club-my-book"/);
  assert.match(bookEditor, /fromClubPrefill/);
  assert.match(bookEditor, /status: "reading", season: "", description: ""/);
  for (const field of ["pageCount", "format", "season", "readingLanguage", "isbn", "publishedYear", "cover"]) {
    assert.match(bookEditor, new RegExp(`name="${field}"`));
  }
});

test("saving the personal club edition uses existing validated API then links progress", async () => {
  const clubs = await read("components/clubs/clubs-page.tsx");
  const editor = await read("components/library/book-dialog.tsx");
  assert.match(editor, /fetch\(book \? `\/api\/books\/\$\{book\.id\}` : "\/api\/books"/);
  assert.match(clubs, /onBookSaved\(saved\)/);
  assert.match(clubs, /linkMyBook\(saved\.id\)/);
  assert.match(clubs, /setPendingBookId\(saved\.id\)/);
});

test("profile names are authenticated, editable and synchronize across existing clubs", async () => {
  const route = await read("app/api/profile/name/route.ts");
  const migration = await read("supabase/migrations/202611150003_club_book_template_profile_names.sql");
  const ui = await read("components/profile/display-name-editor.tsx");
  assert.match(route, /requireUser\(supabase\)/);
  assert.match(route, /z\.string\(\)\.trim\(\)\.min\(1\)\.max\(80\)/);
  assert.match(route, /\.eq\("user_id", userId\)/);
  assert.match(migration, /after update of display_name on public\.profiles/);
  assert.match(migration, /private\.sync_club_member_display_name/);
  assert.match(ui, /\/api\/profile\/name/);
});

test("club onboarding and name settings have both en and ru copy", async () => {
  const dictionary = await read("lib/app-copy.ts");
  for (const key of ["clubAddBookQuestion", "clubAddBookButton", "clubConnectExisting", "clubLibraryConnected", "profileNameHeading", "profileSaveName", "profileNameError"]) {
    assert.equal(dictionary.match(new RegExp(`${key}:`, "g"))?.length, 2, `${key} missing from a locale`);
  }
});
