import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

const localeSchema = z.object({ locale: z.enum(["en", "ru"]) });

export async function PUT(request: Request) {
  const parsed = localeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_locale" }, { status: 400 });

  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const { error } = await supabase
    .from("profiles")
    .update({ locale: parsed.data.locale })
    .eq("user_id", userId);
  if (error) return NextResponse.json({ error: "locale_update_failed" }, { status: 500 });

  return NextResponse.json({ locale: parsed.data.locale });
}
