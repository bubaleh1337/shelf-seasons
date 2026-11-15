import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

const nameSchema = z.object({ displayName: z.string().trim().min(1).max(80) });

export async function PUT(request: Request) {
  const parsed = nameSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_name" }, { status: 400 });

  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("user_id", userId)
    .select("display_name")
    .single();
  if (error || !data?.display_name) return NextResponse.json({ error: "name_save_failed" }, { status: 500 });

  return NextResponse.json({ displayName: data.display_name });
}
