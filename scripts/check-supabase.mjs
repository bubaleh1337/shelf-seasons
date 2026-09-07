import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env.local");
} catch {
  console.error("Supabase check failed: local configuration file was not found.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Supabase check failed: project URL or publishable key is missing.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const health = await fetch(`${url}/auth/v1/health`, {
  headers,
  signal: AbortSignal.timeout(15_000),
});
if (!health.ok) {
  console.error(`Supabase Auth health check failed with HTTP ${health.status}.`);
  process.exit(1);
}

async function checkProtectedTable(table, stage) {
  const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (response.ok) return;
  const payload = await response.json().catch(() => ({}));
  const isExpectedAnonDenial = response.status === 401 && payload?.code === "42501";
  if (isExpectedAnonDenial) return;
  console.error(`Supabase check failed: apply the ${stage} migration first.`);
  process.exit(1);
}

await checkProtectedTable("profiles", "Stage 2 profile");
await checkProtectedTable("library_books", "Stage 3 personal library");
await checkProtectedTable("reading_runs", "Stage 4 reading tracker");
await checkProtectedTable("reading_sessions", "Stage 4 reading tracker");
await checkProtectedTable("run_nominations", "0.6.0 completion and goals");
await checkProtectedTable("series", "0.7.0 series");
await checkProtectedTable("series_entries", "0.7.0 series");
await checkProtectedTable("recap_selections", "0.8.0 recaps");

const schemaResponse = await fetch(`${url}/rest/v1/`, {
  headers: { ...headers, Accept: "application/openapi+json" },
  signal: AbortSignal.timeout(15_000),
});
if (!schemaResponse.ok) {
  console.error("Supabase check failed: the REST schema could not be read.");
  process.exit(1);
}
const schema = await schemaResponse.json();
const libraryColumns = schema?.definitions?.library_books?.properties ?? {};
const runColumns = schema?.definitions?.reading_runs?.properties ?? {};
if (!("season" in libraryColumns) || !("reading_language" in libraryColumns) || !("reading_language" in runColumns)) {
  console.error("Supabase check failed: apply the 0.10.0 seasons and languages migration first.");
  process.exit(1);
}

console.log("Supabase Auth is healthy and the 0.10.0 seasons and languages schema is available.");
