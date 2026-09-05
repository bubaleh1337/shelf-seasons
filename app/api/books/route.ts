import { NextRequest, NextResponse } from "next/server";
import { bookInputSchema } from "@/lib/books/validation";
import { bookToDto, requireUser, storeCover, storeRemoteCover, toInsert } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await request.formData();
  const parsed = bookInputSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.json({ error: "invalid_book" }, { status: 400 });
  const { data: row, error } = await supabase.from("library_books").insert(toInsert(userId, parsed.data)).select().single();
  if (error || !row) return NextResponse.json({ error: "save_failed" }, { status: 400 });

  const cover = form.get("cover");
  if (!(cover instanceof File) || cover.size === 0) {
    if (!parsed.data.coverUrl) return NextResponse.json({ book: await bookToDto(supabase, row) }, { status: 201 });
    try {
      const coverPath = await storeRemoteCover(supabase, userId, row.id, parsed.data.coverUrl);
      const { data: updated } = await supabase.from("library_books").update({ cover_path: coverPath }).eq("id", row.id).eq("user_id", userId).select().single();
      return NextResponse.json({ book: await bookToDto(supabase, updated ?? row) }, { status: 201 });
    } catch {
      return NextResponse.json({ book: await bookToDto(supabase, row) }, { status: 201 });
    }
  }

  try {
    const coverPath = await storeCover(supabase, userId, row.id, cover);
    const { data: updated, error: updateError } = await supabase.from("library_books").update({ cover_path: coverPath }).eq("id", row.id).eq("user_id", userId).select().single();
    if (updateError || !updated) throw updateError ?? new Error("cover_update_failed");
    return NextResponse.json({ book: await bookToDto(supabase, updated) }, { status: 201 });
  } catch {
    await supabase.from("library_books").delete().eq("id", row.id).eq("user_id", userId);
    return NextResponse.json({ error: "cover_failed" }, { status: 400 });
  }
}
