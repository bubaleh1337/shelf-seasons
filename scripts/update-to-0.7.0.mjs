import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCache = path.join(projectRoot, ".next");

await rm(nextCache, { recursive: true, force: true });
console.log("Shelf Seasons 0.7.0 cache cleanup completed.");
