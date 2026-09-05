import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("OAuth start and callback attach Supabase cookies to redirect responses", async () => {
  const google = await read("app/auth/google/route.ts");
  const callback = await read("app/auth/callback/route.ts");
  const routeClient = await read("lib/supabase/route.ts");

  assert.match(google, /createRouteClient\(request\)/);
  assert.match(google, /return redirect\(data\.url\)/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /return redirect\(new URL\(next, request\.nextUrl\.origin\)\)/);
  assert.match(routeClient, /response\.cookies\.set\(name, value, options\)/);
});

test("OAuth uses the exact request origin for Vercel aliases and localhost", async () => {
  const google = await read("app/auth/google/route.ts");
  const callback = await read("app/auth/callback/route.ts");
  assert.match(google, /new URL\("\/auth\/callback", request\.nextUrl\.origin\)/);
  assert.match(callback, /request\.nextUrl\.origin/);
});
