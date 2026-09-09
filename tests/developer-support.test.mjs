import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("developer contacts and project support use the approved public destinations", async () => {
  const [source, copy, css] = await Promise.all([
    read("components/shelf-seasons-app.tsx"),
    read("lib/app-copy.ts"),
    read("app/globals.css"),
  ]);

  assert.match(source, /https:\/\/buymeacoffee\.com\/kate\.asmdef/);
  assert.match(source, /mailto:ekaterina\.pyshkova@gmail\.com/);
  assert.match(source, /https:\/\/t\.me\/kemisayega/);
  assert.match(source, /target="_blank" rel="noopener noreferrer"/);
  assert.match(source, /<DeveloperSection locale=\{locale\}/);
  assert.match(source, /mobile-settings-link/);
  assert.match(copy, /supportProject: "Support the project"/);
  assert.match(copy, /supportProject: "Поддержать проект"/);
  assert.match(copy, /developerName: "Ekaterina"/);
  assert.match(copy, /developerName: "Екатерина"/);
  assert.doesNotMatch(copy, /Pupykina|Пупыкина/);
  assert.match(css, /\.developer-contact-grid/);
  assert.match(css, /\.sidebar-developer-links/);
  assert.match(css, /\.mobile-settings-link/);
});
