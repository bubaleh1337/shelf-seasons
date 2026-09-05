import { NextRequest, NextResponse } from "next/server";
import { parseLocale } from "@/lib/auth/redirect";
import { getAppOrigin, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const themes = new Set(["system", "light", "dark"] as const);

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const locale = parseLocale(String(formData.get("locale") ?? "en"));
  const timezone = String(formData.get("timezone") ?? "").trim();
  const rawTheme = String(formData.get("theme") ?? "system");
  const theme = themes.has(rawTheme as "system" | "light" | "dark")
    ? (rawTheme as "system" | "light" | "dark")
    : "system";
  const rawGoal = String(formData.get("goal") ?? "").trim();
  const goal = rawGoal === "" ? null : Number(rawGoal);
  const errorUrl = new URL(`/${locale}/onboarding`, getAppOrigin());

  if (
    !isSupabaseConfigured ||
    timezone.length < 1 ||
    timezone.length > 64 ||
    (goal !== null && (!Number.isInteger(goal) || goal < 1 || goal > 999))
  ) {
    errorUrl.searchParams.set("error", "invalid_settings");
    return NextResponse.redirect(errorUrl, 303);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    return NextResponse.redirect(
      new URL(`/${locale}/sign-in?error=session_missing`, getAppOrigin()),
      303,
    );
  }

  const { error } = await supabase.rpc("complete_onboarding", {
    p_locale: locale,
    p_timezone: timezone,
    p_theme: theme,
    p_yearly_goal: goal,
  });

  if (error) {
    errorUrl.searchParams.set("error", "save_failed");
    return NextResponse.redirect(errorUrl, 303);
  }

  return NextResponse.redirect(
    new URL(`/${locale}/app`, getAppOrigin()),
    303,
  );
}
