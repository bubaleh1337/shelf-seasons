import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

const progressSchema = z.object({ readId: z.string().uuid(), bookId: z.string().uuid() });
type Context = { params: Promise<{ clubId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { clubId } = await params;
  if (!z.string().uuid().safeParse(clubId).success) return NextResponse.json({ error: "invalid_club" }, { status: 400 });
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = progressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_progress" }, { status: 400 });
  const [{ data: read }, { data: book }] = await Promise.all([
    supabase.from("book_club_reads").select("id").eq("id", parsed.data.readId).eq("club_id", clubId).eq("status", "active").maybeSingle(),
    supabase.from("library_books").select("id").eq("id", parsed.data.bookId).eq("user_id", userId).maybeSingle(),
  ]);
  if (!read || !book) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data: existing } = await supabase.from("book_club_progress")
    .select("club_read_id").eq("club_read_id", read.id).eq("user_id", userId).maybeSingle();
  const result = existing
    ? await supabase.from("book_club_progress").update({ book_id: book.id })
        .eq("club_read_id", read.id).eq("user_id", userId)
    : await supabase.from("book_club_progress").insert({
        club_read_id: read.id, club_id: clubId, user_id: userId, book_id: book.id,
      });
  if (result.error) return NextResponse.json({ error: "progress_link_failed" }, { status: 400 });
  return NextResponse.json({ linked: true });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const { clubId } = await params;
  if (!z.string().uuid().safeParse(clubId).success) return NextResponse.json({ error: "invalid_club" }, { status: 400 });
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ readId: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_read" }, { status: 400 });
  const { error } = await supabase.from("book_club_progress").delete()
    .eq("club_read_id", parsed.data.readId).eq("club_id", clubId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: "unlink_failed" }, { status: 400 });
  return NextResponse.json({ linked: false });
}
