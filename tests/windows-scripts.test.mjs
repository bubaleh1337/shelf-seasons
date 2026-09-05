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
  assert.equal(packageJson.dependencies.next, "16.2.6");
  assert.equal(packageJson.devDependencies.vite, undefined);
  assert.equal(packageJson.devDependencies.vinext, undefined);
  assert.equal(packageJson.devDependencies.wrangler, undefined);
});
