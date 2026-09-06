import { NextRequest, NextResponse } from "next/server";
import { parseLocale, safeAppPath } from "@/lib/auth/redirect";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createRouteClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  const next = safeAppPath(request.nextUrl.searchParams.get("next"), locale);
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");
  const signInUrl = new URL(`/${locale}/sign-in`, request.nextUrl.origin);

  if (!isSupabaseConfigured || providerError || !code) {
    signInUrl.searchParams.set("error", "invalid_callback");
    return NextResponse.redirect(signInUrl);
  }

  const { supabase, redirect } = createRouteClient(request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    signInUrl.searchParams.set("error", "code_exchange_failed");
    return redirect(signInUrl);
  }

  return redirect(new URL(next, request.nextUrl.origin));
}
