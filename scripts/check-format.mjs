import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", "node_modules"]);
const checkedExtensions = new Set([".css", ".js", ".json", ".md", ".mjs", ".ts", ".tsx", ".yml", ".yaml"]);
const failures = [];

async function inspect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspect(target);
      continue;
    }
    if (!checkedExtensions.has(path.extname(entry.name))) continue;
    const text = await readFile(target, "utf8");
    const relative = path.relative(root, target);
    if (text.length > 0 && !text.endsWith("\n")) failures.push(`${relative}: missing final newline`);
    text.split("\n").forEach((line, index) => {
      if (/[ \t]+$/.test(line)) failures.push(`${relative}:${index + 1}: trailing whitespace`);
    });
  }
}

await inspect(root);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Formatting checks passed.");
