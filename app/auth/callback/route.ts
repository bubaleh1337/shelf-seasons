import { NextRequest, NextResponse } from "next/server";
import { parseLocale, safeAppPath } from "@/lib/auth/redirect";
import { getAppOrigin, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  const next = safeAppPath(request.nextUrl.searchParams.get("next"), locale);
  const code = request.nextUrl.searchParams.get("code");
  const signInUrl = new URL(`/${locale}/sign-in`, getAppOrigin());

  if (!isSupabaseConfigured || !code) {
    signInUrl.searchParams.set("error", "invalid_callback");
    return NextResponse.redirect(signInUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    signInUrl.searchParams.set("error", "code_exchange_failed");
    return NextResponse.redirect(signInUrl);
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    signInUrl.searchParams.set("error", "session_missing");
    return NextResponse.redirect(signInUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("locale,onboarding_completed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    const profileLocale = parseLocale(profile?.locale ?? locale);
    return NextResponse.redirect(
      new URL(`/${profileLocale}/onboarding`, getAppOrigin()),
    );
  }

  return NextResponse.redirect(new URL(next, getAppOrigin()));
}
