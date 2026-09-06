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

console.log("Supabase Auth is healthy and the 0.6.0 completion schema is available.");
