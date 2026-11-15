import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ clubId: string; readId: string }> };

export async function PATCH(_request: Request, { params }: Context) {
  const { clubId, readId } = await params;
  if (!z.string().uuid().safeParse(clubId).success || !z.string().uuid().safeParse(readId).success) {
    return NextResponse.json({ error: "invalid_read" }, { status: 400 });
  }
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("book_club_reads")
    .update({ status: "finished" }).eq("id", readId).eq("club_id", clubId).eq("status", "active").select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "finish_failed" }, { status: 400 });
  return NextResponse.json({ readId: data.id });
}
