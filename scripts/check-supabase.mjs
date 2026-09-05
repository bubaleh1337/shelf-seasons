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

const profiles = await fetch(`${url}/rest/v1/profiles?select=user_id&limit=1`, {
  headers,
  signal: AbortSignal.timeout(15_000),
});
if (!profiles.ok) {
  const payload = await profiles.json().catch(() => ({}));
  if (profiles.status === 404 && payload?.code === "PGRST205") {
    console.error("Supabase check failed: apply the Stage 2 migration first.");
  } else {
    console.error(`Supabase database check failed with HTTP ${profiles.status}.`);
  }
  process.exit(1);
}

console.log("Supabase Auth is healthy and the Stage 2 database schema is available.");
