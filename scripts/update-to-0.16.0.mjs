import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await rm(path.join(projectRoot, ".next"), { recursive: true, force: true });
await rm(path.join(projectRoot, ".sites-runtime"), { recursive: true, force: true });
console.log("Shelf Seasons 0.16.0 generated-cache cleanup completed.");
