const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

export function getSupabaseConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return { supabaseUrl, supabasePublishableKey };
}

export function getAppOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
  const origin = new URL(configuredOrigin);

  if (
    origin.protocol !== "https:" &&
    !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname))
  ) {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS outside localhost.");
  }

  return origin.origin;
}
