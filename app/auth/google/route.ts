import { NextRequest, NextResponse } from "next/server";
import { parseLocale, safeAppPath } from "@/lib/auth/redirect";
import {
  getAppOrigin,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  const next = safeAppPath(request.nextUrl.searchParams.get("next"), locale);
  const signInUrl = new URL(`/${locale}/sign-in`, request.url);

  if (!isSupabaseConfigured) {
    signInUrl.searchParams.set("error", "not_configured");
    return NextResponse.redirect(signInUrl);
  }

  const callback = new URL("/auth/callback", getAppOrigin());
  callback.searchParams.set("locale", locale);
  callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    signInUrl.searchParams.set("error", "oauth_start_failed");
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.redirect(data.url);
}
