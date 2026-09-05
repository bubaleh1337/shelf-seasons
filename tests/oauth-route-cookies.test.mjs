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
  const callbackRoute = await read("app/auth/callback/route.ts");
  const complete = await read("components/auth/auth-complete-client.tsx");
  const rootProxy = await read("proxy.ts");

  assert.match(callbackRoute, /new URL\("\/auth\/complete"/);
  assert.match(callbackRoute, /completeUrl\.searchParams\.set\("code", code\)/);
  assert.match(complete, /^"use client";/);
  assert.match(complete, /exchangeCodeForSession\(code\)/);
  assert.match(complete, /if \(error \|\| !data\.session\)/);
  assert.match(complete, /window\.location\.replace/);
  assert.match(rootProxy, /pathname\.startsWith\("\/auth\/"\)/);
});

test("OAuth uses the exact request origin for Vercel aliases and localhost", async () => {
  const google = await read("app/auth/google/route.ts");
  const callback = await read("app/auth/callback/route.ts");
  const complete = await read("components/auth/auth-complete-client.tsx");
  assert.match(google, /new URL\("\/auth\/callback", request\.nextUrl\.origin\)/);
  assert.match(callback, /request\.nextUrl\.origin/);
  assert.match(complete, /window\.location\.origin/);
});

test("the Windows updater removes only the obsolete conflicting callback files", async () => {
  const updater = await read("UPDATE_TO_0.5.4.ps1");
  const cleanup = await read("scripts/update-to-0.5.4.mjs");
  assert.match(updater, /scripts\\update-to-0\.5\.4\.mjs/);
  assert.match(cleanup, /"callback", "page\.tsx"/);
  assert.match(cleanup, /"auth-callback-client\.tsx"/);
  assert.match(cleanup, /error\?\.code !== "ENOENT"/);
  assert.doesNotMatch(`${updater}\n${cleanup}`, /-Recurse|rmSync|rmdir/);
});
