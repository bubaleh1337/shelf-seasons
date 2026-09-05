import { NextRequest, NextResponse } from "next/server";
import { parseLocale, safeAppPath } from "@/lib/auth/redirect";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createRouteClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  const next = safeAppPath(request.nextUrl.searchParams.get("next"), locale);
  const code = request.nextUrl.searchParams.get("code");
  const signInUrl = new URL(`/${locale}/sign-in`, request.nextUrl.origin);

  if (!isSupabaseConfigured || !code) {
    signInUrl.searchParams.set("error", "invalid_callback");
    return NextResponse.redirect(signInUrl);
  }

  const { supabase, redirect } = createRouteClient(request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    signInUrl.searchParams.set("error", "code_exchange_failed");
    return redirect(signInUrl);
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    signInUrl.searchParams.set("error", "session_missing");
    return redirect(signInUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("locale,onboarding_completed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    const profileLocale = parseLocale(profile?.locale ?? locale);
    return redirect(
      new URL(`/${profileLocale}/onboarding`, request.nextUrl.origin),
    );
  }

  return redirect(new URL(next, request.nextUrl.origin));
}
