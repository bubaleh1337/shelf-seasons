import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("auth redirects accept only localized application paths", async () => {
  const redirect = await read("lib", "auth", "redirect.ts");
  assert.match(redirect, /value\.startsWith\("\/\/"\)/);
  assert.match(redirect, /parsed\.origin !== "https:\/\/shelf-seasons\.invalid"/);
  assert.match(redirect, /pathname\.startsWith\(`\/\$\{locale\}\/app`\)/);
});

test("server auth protection validates claims instead of trusting getSession", async () => {
  const page = await read("app", "[locale]", "[[...slug]]", "page.tsx");
  const proxy = await read("lib", "supabase", "proxy.ts");
  assert.match(page, /auth\.getClaims\(\)/);
  assert.match(proxy, /auth\.getClaims\(\)/);
  assert.doesNotMatch(`${page}\n${proxy}`, /auth\.getSession\(\)/);
});

test("Stage 2 migration enables ownership RLS and derives the onboarding owner", async () => {
  const migration = await read(
    "supabase",
    "migrations",
    "202609050001_stage_2_profiles.sql",
  );
  assert.match(migration, /alter table public\.profiles enable row level security/i);
  assert.match(migration, /alter table public\.reading_goals enable row level security/i);
  assert.match(migration, /\(select auth\.uid\(\)\) = user_id/g);
  assert.match(migration, /current_user_id uuid := auth\.uid\(\)/);
  assert.doesNotMatch(migration, /service_role/i);
});

test("secrets stay outside the browser environment template", async () => {
  const env = await read(".env.example");
  assert.match(env, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(env, /NEXT_PUBLIC_(?:SUPABASE_)?(?:SERVICE|SECRET)/i);
});
