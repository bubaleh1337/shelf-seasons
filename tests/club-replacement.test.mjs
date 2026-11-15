import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("club replacement requires owner, locks club and preserves history", async () => {
  const sql = await read("supabase/migrations/202611150004_replace_club_read.sql");
  assert.match(sql, /status in \('active', 'finished', 'replaced'\)/);
  assert.match(sql, /c\.owner_id = current_user_id/);
  assert.match(sql, /p_previous_read_id.*p_club_id.*r\.status = 'active'/);
  assert.match(sql, /for update/);
  assert.match(sql, /set status = 'replaced'/);
  assert.match(sql, /insert into public\.book_club_reads/);
  assert.match(sql, /insert into public\.book_club_progress/);
  assert.match(sql, /source_book\.cover_url/);
  assert.doesNotMatch(sql, /delete from public\.(?:library_books|reading_runs|reading_sessions|book_club_progress)/i);
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /revoke all on function public\.replace_book_club_read/);
});

test("club replacement API authenticates and never accepts user_id", async () => {
  const route = await read("app/api/clubs/[clubId]/reads/[readId]/replace/route.ts");
  assert.match(route, /requireUser\(supabase\)/);
  assert.match(route, /replace_book_club_read/);
  assert.doesNotMatch(route, /user_id:\s*parsed\.data|userId:\s*parsed\.data/);
  assert.match(route, /p_previous_read_id: readId/);
});

test("club replacement asks for confirmation and explains replaced history", async () => {
  const page = await read("components/clubs/clubs-page.tsx");
  const copy = await read("lib/app-copy.ts");
  assert.match(page, /window\.confirm\(c\.clubReplaceConfirm/);
  assert.match(page, /clubReplaceBook/);
  assert.match(page, /read\.status === "replaced"/);
  assert.match(copy, /clubReplaceBook: "Change book"/);
  assert.match(copy, /clubReplaceBook: "Сменить книгу"/);
});
