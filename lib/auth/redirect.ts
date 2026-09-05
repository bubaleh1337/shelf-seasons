import type { Locale } from "@/lib/shelf-seasons";

export function parseLocale(value: string | null | undefined): Locale {
  return value === "ru" ? "ru" : "en";
}

export function safeAppPath(
  value: string | null | undefined,
  locale: Locale,
) {
  const fallback = `/${locale}/app`;
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const parsed = new URL(value, "https://shelf-seasons.invalid");
    if (parsed.origin !== "https://shelf-seasons.invalid") return fallback;
    if (!parsed.pathname.startsWith(`/${locale}/app`)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
