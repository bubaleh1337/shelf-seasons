import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("project commands are portable to Windows PowerShell", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const portableScripts = ["install:ci", "dev", "build", "start", "lint", "typecheck", "format:check"];

  for (const name of portableScripts) {
    const command = packageJson.scripts[name];
    assert.equal(typeof command, "string", `${name} must exist`);
    assert.doesNotMatch(command, /\bbash\b|^[A-Z_][A-Z0-9_]*=/, `${name} must not require a Unix shell`);
  }

  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts.start, "next start");
  assert.equal(packageJson.dependencies.next, "16.3.4");
  assert.equal(packageJson.devDependencies.vite, undefined);
  assert.equal(packageJson.devDependencies.vinext, undefined);
  assert.equal(packageJson.devDependencies.wrangler, undefined);
});

test("the 0.6.0 updater only clears the generated Next.js cache", async () => {
  const updater = await readFile(new URL("../scripts/update-to-0.6.0.mjs", import.meta.url), "utf8");
  assert.match(updater, /path\.join\(projectRoot, "\.next"\)/);
  assert.match(updater, /rm\(nextCache, \{ recursive: true, force: true \}\)/);
  assert.doesNotMatch(updater, /node_modules|\.env\.local|\.git/);
});

test("the 0.7.0 updater only clears the generated Next.js cache", async () => {
  const updater = await readFile(new URL("../scripts/update-to-0.7.0.mjs", import.meta.url), "utf8");
  assert.match(updater, /path\.join\(projectRoot, "\.next"\)/);
  assert.match(updater, /rm\(nextCache, \{ recursive: true, force: true \}\)/);
  assert.doesNotMatch(updater, /node_modules|\.env\.local|\.git/);
});

test("the 0.8.0 updater only clears the generated Next.js cache", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.8.0.mjs", import.meta.url), "utf8");
  assert.match(script, /path\.join\(projectRoot, "\.next"\)/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.9.0 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.9.0.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.10.0 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.10.0.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.11.0 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.11.0.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.12.0 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.12.0.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.13.0 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.13.0.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.14.0 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.14.0.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.14.1 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.14.1.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.15.0 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.15.0.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.16.0 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.16.0.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.17.0 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.17.0.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});

test("the 0.17.1 updater only clears generated caches", async () => {
  const script = await readFile(new URL("../scripts/update-to-0.17.1.mjs", import.meta.url), "utf8");
  assert.match(script, /\.next/);
  assert.match(script, /\.sites-runtime/);
  assert.doesNotMatch(script, /node_modules|\.git|\.env\.local/);
});
