import { NextRequest, NextResponse } from "next/server";
import { parseLocale } from "@/lib/auth/redirect";
import { getAppOrigin, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const locale = parseLocale(String(formData.get("locale") ?? "en"));

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }

  return NextResponse.redirect(
    new URL(`/${locale}/sign-in`, getAppOrigin()),
    303,
  );
}
