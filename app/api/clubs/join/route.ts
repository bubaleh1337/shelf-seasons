import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

const joinSchema = z.object({ token: z.string().regex(/^[a-f0-9]{32}$/) });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_invite" }, { status: 400 });
  const { data: clubId, error } = await supabase.rpc("join_book_club", { p_invite_token: parsed.data.token });
  if (error || !clubId) return NextResponse.json({ error: "join_failed" }, { status: 400 });
  return NextResponse.json({ clubId });
}
