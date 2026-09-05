import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

async function readCssTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return readCssTree(entryPath);
      return entry.name.endsWith(".css") ? readFile(entryPath, "utf8") : "";
    }),
  );
  return contents.join("\n");
}

test("standard Next.js build emits the complete application stylesheet", async () => {
  const css = await readCssTree(path.join(root, ".next"));

  assert.match(css, /\.shelf-app/);
  assert.match(css, /\.shelf-sidebar/);
  assert.match(css, /\.book-cover/);
  assert.match(css, /scrollbar-width:\s*thin/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("navigation components keep accessibility semantics", async () => {
  const app = await readFile(path.join(root, "components", "shelf-seasons-demo.tsx"), "utf8");

  assert.match(app, /aria-current/);
  assert.match(app, /Primary navigation/);
  assert.match(app, /Основная навигация/);
});

test("image optimization is disabled consistently in every environment", async () => {
  const config = await readFile(path.join(root, "next.config.ts"), "utf8");

  assert.match(config, /unoptimized:\s*true/);
  assert.doesNotMatch(config, /vinext|cloudflare|wrangler/i);
});
