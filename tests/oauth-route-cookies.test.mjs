import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("OAuth start attaches the PKCE verifier cookie to its redirect", async () => {
  const google = await read("app/auth/google/route.ts");
  const routeClient = await read("lib/supabase/route.ts");

  assert.match(google, /createRouteClient\(request\)/);
  assert.match(google, /return redirect\(data\.url\)/);
  assert.match(routeClient, /response\.cookies\.set\(name, value, options\)/);
});

test("the browser completes PKCE before navigating to a protected page", async () => {
  const callback = await read("components/auth/auth-callback-client.tsx");
  const rootProxy = await read("proxy.ts");

  assert.match(callback, /^"use client";/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /if \(error \|\| !data\.session\)/);
  assert.match(callback, /window\.location\.replace/);
  assert.match(rootProxy, /pathname\.startsWith\("\/auth\/"\)/);
});

test("OAuth uses the exact request origin for Vercel aliases and localhost", async () => {
  const google = await read("app/auth/google/route.ts");
  const callback = await read("components/auth/auth-callback-client.tsx");
  assert.match(google, /new URL\("\/auth\/callback", request\.nextUrl\.origin\)/);
  assert.match(callback, /window\.location\.origin/);
});
