import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("Vercel production hostname becomes the secure OAuth origin", () => {
  const source = "import('./lib/supabase/config.ts').then(({getAppOrigin}) => console.log(getAppOrigin()))";
  const env = { ...process.env, NEXT_PUBLIC_APP_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "shelf-seasons.vercel.app" };
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", source], {
    cwd: process.cwd(),
    encoding: "utf8",
    env,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "https://shelf-seasons.vercel.app");
});
