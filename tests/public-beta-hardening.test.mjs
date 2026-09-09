import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production dependencies use patched releases and the lockfile pins them", async () => {
  const [manifest, lock] = await Promise.all([
    import("../package.json", { with: { type: "json" } }).then((module) => module.default),
    import("../package-lock.json", { with: { type: "json" } }).then((module) => module.default),
  ]);
  assert.equal(manifest.dependencies.next, "16.3.4");
  assert.equal(manifest.dependencies.sharp, "0.35.4");
  assert.equal(lock.packages["node_modules/next"].version, "16.3.4");
  assert.equal(lock.packages["node_modules/sharp"].version, "0.35.4");
});

test("public routes send browser security headers", async () => {
  const config = await read("next.config.ts");
  for (const name of ["Content-Security-Policy", "Referrer-Policy", "X-Content-Type-Options", "X-Frame-Options", "Permissions-Policy"]) {
    assert.match(config, new RegExp(name));
  }
  assert.match(config, /poweredByHeader:\s*false/);
  assert.match(config, /frame-ancestors 'none'/);
});

test("rate limits are atomic, private and applied to expensive routes", async () => {
  const [migration, limiter, search, repair, books, book] = await Promise.all([
    read("supabase/migrations/202609090003_public_beta_hardening.sql"),
    read("lib/security/rate-limit.ts"),
    read("app/api/books/search/route.ts"),
    read("app/api/books/repair-covers/route.ts"),
    read("app/api/books/route.ts"),
    read("app/api/books/[bookId]/route.ts"),
  ]);
  assert.match(migration, /create table if not exists public\.request_rate_limits/i);
  assert.match(migration, /on conflict \(user_id, bucket\) do update/i);
  assert.match(migration, /force row level security/i);
  assert.match(migration, /revoke all on table public\.request_rate_limits from public, anon, authenticated/i);
  assert.match(limiter, /status: 429/);
  assert.match(limiter, /"Retry-After"/);
  assert.match(search, /"book-search", 30, 60/);
  assert.match(repair, /"cover-repair", 3, 3600/);
  assert.match(books, /"book-write", 30, 300/);
  assert.match(book, /"book-write", 30, 300/);
});

test("localized legal pages and private-route indexing rules are present", async () => {
  const [page, legal, auth, settings] = await Promise.all([
    read("app/[locale]/[[...slug]]/page.tsx"),
    read("lib/legal/copy.ts"),
    read("components/auth/auth-pages.tsx"),
    read("components/shelf-seasons-app.tsx"),
  ]);
  assert.match(page, /generateMetadata/);
  assert.match(page, /index: false, follow: false, noarchive: true/);
  assert.match(page, /<LegalPage locale=\{locale\}/);
  assert.match(legal, /Privacy policy/);
  assert.match(legal, /Политика конфиденциальности/);
  assert.match(legal, /Terms of use/);
  assert.match(legal, /Условия использования/);
  assert.match(auth, /`\/\$\{locale\}\/privacy`/);
  assert.match(settings, /`\/\$\{locale\}\/terms`/);
});

test("cover downloads and automatic repair work stay bounded", async () => {
  const [server, app] = await Promise.all([
    read("lib/books/server.ts"),
    read("components/shelf-seasons-app.tsx"),
  ]);
  assert.match(server, /MAX_COVER_BYTES = 5 \* 1024 \* 1024/);
  assert.match(server, /response\.body\.getReader\(\)/);
  assert.match(server, /received > MAX_COVER_BYTES/);
  assert.match(app, /7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(app, /navigator\.onLine/);
});

test("installable PWA icons are small and declared", async () => {
  const manifest = await read("app/manifest.ts");
  for (const [file, expected] of [["icon-192.png", "192x192"], ["icon-512.png", "512x512"], ["apple-touch-icon.png", null]]) {
    const details = await stat(new URL(`../public/${file}`, import.meta.url));
    assert.ok(details.size < 100_000, `${file} is unexpectedly large`);
    if (expected) assert.match(manifest, new RegExp(expected));
  }
});
