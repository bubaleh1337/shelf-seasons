import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("project commands are portable to Windows PowerShell", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const portableScripts = ["install:ci", "dev", "build", "start", "lint", "typecheck", "format:check", "db:generate"];

  for (const name of portableScripts) {
    const command = packageJson.scripts[name];
    assert.equal(typeof command, "string", `${name} must exist`);
    assert.doesNotMatch(command, /\bbash\b|^[A-Z_][A-Z0-9_]*=/, `${name} must not require a Unix shell`);
  }
});
