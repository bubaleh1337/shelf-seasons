import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("OAuth starts in the browser so the PKCE verifier stays on the same device", async () => {
  const button = await read("components/auth/google-sign-in-button.tsx");
  const signInPage = await read("components/auth/auth-pages.tsx");

  assert.match(button, /^"use client";/);
  assert.match(button, /createClient\(\)/);
  assert.match(button, /signInWithOAuth\(/);
  assert.match(button, /new URL\("\/auth\/callback", window\.location\.origin\)/);
  assert.match(button, /redirectTo: callback\.toString\(\)/);
  assert.match(signInPage, /<GoogleSignInButton/);
  assert.doesNotMatch(signInPage, /action="\/auth\/google"/);
});

test("the server callback exchanges the code and attaches session cookies before redirecting", async () => {
  const callbackRoute = await read("app/auth/callback/route.ts");
  const routeClient = await read("lib/supabase/route.ts");
  const rootProxy = await read("proxy.ts");

  assert.match(callbackRoute, /exchangeCodeForSession\(code\)/);
  assert.match(callbackRoute, /return redirect\(new URL\(next, request\.nextUrl\.origin\)\)/);
  assert.match(routeClient, /response\.cookies\.set\(name, value, options\)/);
  assert.match(rootProxy, /pathname\.startsWith\("\/auth\/"\)/);
});

test("OAuth uses the exact request origin for Vercel aliases and localhost", async () => {
  const button = await read("components/auth/google-sign-in-button.tsx");
  const callback = await read("app/auth/callback/route.ts");
  assert.match(button, /window\.location\.origin/);
  assert.match(callback, /request\.nextUrl\.origin/);
});

test("the Windows updater removes only obsolete OAuth implementation files", async () => {
  const updater = await read("UPDATE_TO_0.5.5.ps1");
  const cleanup = await read("scripts/update-to-0.5.5.mjs");
  assert.match(updater, /scripts\\update-to-0\.5\.5\.mjs/);
  assert.match(cleanup, /"complete", "page\.tsx"/);
  assert.match(cleanup, /"google", "route\.tsx"|"google", "route\.ts"/);
  assert.match(cleanup, /"auth-complete-client\.tsx"/);
  assert.match(cleanup, /error\?\.code !== "ENOENT"/);
  assert.doesNotMatch(`${updater}\n${cleanup}`, /-Recurse|rmSync|rmdir/);
});
