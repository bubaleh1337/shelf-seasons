import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("club owners can read freshly created clubs without exposing clubs to nonmembers", async () => {
  const sql = await read("supabase/migrations/202611150002_book_clubs_owner_select_rls_fix.sql");
  const api = await read("app/api/clubs/route.ts");
  assert.match(sql, /alter policy book_clubs_select_members\s+on public\.book_clubs/i);
  assert.match(sql, /owner_id\s*=\s*\(select auth\.uid\(\)\)/i);
  assert.match(sql, /or id in \(select private\.club_ids_for_user\(\)\)/i);
  assert.match(api, /insert\(\{ owner_id: userId, name: parsed\.data\.name \}\)/);
  assert.match(api, /\.select\("id,owner_id,name,created_at"\)\.single\(\)/);
  assert.doesNotMatch(sql, /\busing \(true\)|\bwith check \(true\)/i);
});
