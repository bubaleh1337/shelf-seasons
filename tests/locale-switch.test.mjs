import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("authenticated language switching persists the profile before navigation", async () => {
  const [route, app] = await Promise.all([
    readFile(new URL("../app/api/profile/locale/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/shelf-seasons-app.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(route, /requireUser\(supabase\)/);
  assert.match(route, /\.update\(\{ locale: parsed\.data\.locale \}\)/);
  assert.match(app, /fetch\("\/api\/profile\/locale"/);
  assert.match(app, /window\.location\.assign\(`\/\$\{targetLocale\}\/app\$\{suffix\}`\)/);
  assert.doesNotMatch(app, /className="locale-switch" href=/);
});
