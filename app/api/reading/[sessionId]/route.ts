import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ sessionId: string }> };

export async function DELETE(_request: NextRequest, context: Context) {
  const { sessionId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { error } = await supabase.from("reading_sessions").delete().eq("id", sessionId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
