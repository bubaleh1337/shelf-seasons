import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const file = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("club organizer actions are grouped separately instead of side by side", async () => {
  const page = await file("components/clubs/clubs-page.tsx");
  assert.match(page, /className="club-organizer-manage"/);
  assert.match(page, /className="club-organizer-complete"/);
  assert.match(page, /className="club-create-read club-replace-form"/);
  assert.match(page, /className="club-secondary club-finish-success"/);
  assert.match(page, /<Check aria-hidden="true" \/>/);
  assert.match(page, /c\.clubFinishHint/);
  assert.match(page, /window\.confirm\(c\.clubFinishConfirm\)/);
});

test("finish button has distinct green styling and mobile stacking", async () => {
  const css = await file("app/clubs.css");
  assert.match(css, /\.club-organizer-actions\s*\{[^}]*display:\s*grid;[^}]*gap:\s*26px/);
  assert.match(css, /\.club-organizer-complete\s*\{[^}]*padding-top:\s*24px/);
  assert.match(css, /\.club-secondary\.club-finish-success\s*\{[^}]*background:\s*#306b4c/);
  assert.doesNotMatch(css, /\.club-secondary\.club-finish-danger\s*\{/);
  assert.match(css, /\.club-replace-form\s*\{[^}]*border:\s*1px/);
  assert.match(css, /@media \(max-width: 600px\)[^\n]*club-organizer-complete/);
});

test("organizer finish explanation is bilingual and independent of the dialog confirmation", async () => {
  const copy = await file("lib/app-copy.ts");
  assert.match(copy, /clubFinishHint: "The book moves/);
  assert.match(copy, /clubFinishHint: "Книга перейдёт в историю клуба/);
  assert.match(copy, /clubFinishConfirm: "Finish reading this book/);
  assert.match(copy, /clubFinishConfirm: "Завершить чтение этой книги/);
  assert.match(copy, /clubFinishRead: "Finish reading this book"/);
  assert.match(copy, /clubFinishRead: "Завершить чтение этой книги"/);
});
