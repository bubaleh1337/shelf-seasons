import assert from "node:assert/strict";
import { stat, readFile } from "node:fs/promises";
import test from "node:test";

test("initial application data loads concurrently and cover links are batched", async () => {
  const [page, books] = await Promise.all([
    readFile(new URL("../app/[locale]/[[...slug]]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/books/server.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /await Promise\.all\(\[/);
  assert.match(page, /booksToDtos\(supabase, rows \?\? \[\]\)/);
  assert.match(books, /createSignedUrls\(chunk, 3600\)/);
});

test("heavy sections are split from the main interactive bundle", async () => {
  const source = await readFile(new URL("../components/shelf-seasons-app.tsx", import.meta.url), "utf8");
  assert.match(source, /dynamic\(\(\) => import\("@\/components\/recaps\/recaps-page"\)/);
  assert.match(source, /dynamic\(\(\) => import\("@\/components\/series\/series-page"\)/);
  assert.match(source, /dynamic\(\(\) => import\("@\/components\/library\/seasonal-shelves"\)/);
});

test("bundled demonstration cover stays lightweight", async () => {
  const cover = await stat(new URL("../public/glass-orchard.webp", import.meta.url));
  assert.ok(cover.size < 250_000, `demo cover is ${cover.size} bytes`);
});
