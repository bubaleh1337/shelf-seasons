import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const obsoleteFiles = [
  path.join(projectRoot, "app", "auth", "callback", "page.tsx"),
  path.join(projectRoot, "components", "auth", "auth-callback-client.tsx"),
];

for (const obsoleteFile of obsoleteFiles) {
  try {
    await unlink(obsoleteFile);
    console.log(`Removed obsolete file: ${path.relative(projectRoot, obsoleteFile)}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

console.log("Shelf Seasons 0.5.4 cleanup completed.");
