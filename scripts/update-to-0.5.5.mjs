import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const obsoleteFiles = [
  path.join(projectRoot, "app", "auth", "complete", "page.tsx"),
  path.join(projectRoot, "app", "auth", "google", "route.ts"),
  path.join(projectRoot, "components", "auth", "auth-complete-client.tsx"),
];

for (const file of obsoleteFiles) {
  try {
    await unlink(file);
    console.log(`Removed obsolete file: ${path.relative(projectRoot, file)}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

console.log("Shelf Seasons 0.5.5 cleanup completed.");
