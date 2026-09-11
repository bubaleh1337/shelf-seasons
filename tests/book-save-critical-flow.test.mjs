import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("critical searched-book save path is independent of provider cover persistence", async () => {
  const [createRoute, dialog] = await Promise.all([
    read("app/api/books/route.ts"),
    read("components/library/book-dialog.tsx"),
  ]);

  assert.match(dialog, /setDraft\(fromResult\(result\)\)/);
  assert.match(dialog, /<select name="status" value=\{draft\.status\}/);
  assert.match(dialog, /fetch\(book \? `\/api\/books\/\$\{book\.id\}` : "\/api\/books"/);
  assert.match(createRoute, /const desiredStatus = values\.status \?\? "want"/);
  assert.match(createRoute, /insert\(\{ \.\.\.values, status: "want" \}\)/);
  assert.match(createRoute, /setBookStatus\(supabase, row\.id, desiredStatus\)/);
  assert.doesNotMatch(createRoute, /resolveProviderCover|storeRemoteCover/);
  assert.match(dialog, /void fetch\("\/api\/books\/repair-covers", \{ method: "POST" \}\)/);
});

test("book writes fail open only when rate-limit infrastructure itself is unavailable", async () => {
  const [createRoute, updateRoute, limiter] = await Promise.all([
    read("app/api/books/route.ts"),
    read("app/api/books/[bookId]/route.ts"),
    read("lib/security/rate-limit.ts"),
  ]);

  for (const route of [createRoute, updateRoute]) {
    assert.match(route, /rateLimitResponse\(supabase, "book-write", 30, 300, \{[\s\S]*continueOnInfrastructureError: true/);
  }
  assert.match(limiter, /if \(options\.continueOnInfrastructureError\) return null/);
  assert.match(limiter, /status: 429/);
  assert.match(limiter, /too_many_requests/);
});

test("save errors are surfaced with bilingual, actionable messages", async () => {
  const dialog = await read("components/library/book-dialog.tsx");
  assert.match(dialog, /Слишком много попыток сохранения/);
  assert.match(dialog, /Too many save attempts/);
  assert.match(dialog, /cover_too_large/);
  assert.match(dialog, /status_sync_failed/);
  assert.match(dialog, /response\.json\(\)\.catch/);
});

test("removing a custom cover does not delete storage before metadata save succeeds", async () => {
  const updateRoute = await read("app/api/books/[bookId]/route.ts");
  const updatePosition = updateRoute.indexOf('.update({ ...metadata, cover_path: coverPath })');
  const removePosition = updateRoute.indexOf('storage.from("book-covers").remove([previousCoverPath])');
  assert.ok(updatePosition >= 0);
  assert.ok(removePosition > updatePosition);
});
