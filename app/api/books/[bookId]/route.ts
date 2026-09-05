import { NextRequest, NextResponse } from "next/server";
import { bookInputSchema } from "@/lib/books/validation";
import { bookToDto, requireUser, setBookStatus, storeCover, storeRemoteCover, toInsert } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ bookId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const { bookId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await request.formData();
  const parsed = bookInputSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.json({ error: "invalid_book" }, { status: 400 });
  const { data: current } = await supabase.from("library_books").select().eq("id", bookId).eq("user_id", userId).maybeSingle();
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let coverPath = current.cover_path;
  const cover = form.get("cover");
  try {
    if (parsed.data.removeCover && coverPath) {
      await supabase.storage.from("book-covers").remove([coverPath]);
      coverPath = null;
      if (parsed.data.coverUrl) coverPath = await storeRemoteCover(supabase, userId, bookId, parsed.data.coverUrl);
    }
    if (cover instanceof File && cover.size > 0) coverPath = await storeCover(supabase, userId, bookId, cover);
  } catch {
    return NextResponse.json({ error: "cover_failed" }, { status: 400 });
  }

  const values = toInsert(userId, parsed.data);
  const { status, ...metadata } = values;
  const { error } = await supabase.from("library_books").update({ ...metadata, cover_path: coverPath }).eq("id", bookId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  let updated;
  try {
    updated = await setBookStatus(supabase, bookId, status ?? "want");
  } catch {
    return NextResponse.json({ error: "status_sync_failed" }, { status: 400 });
  }
  return NextResponse.json({ book: await bookToDto(supabase, updated) });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { bookId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: current } = await supabase.from("library_books").select("cover_path").eq("id", bookId).eq("user_id", userId).maybeSingle();
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { error } = await supabase.from("library_books").delete().eq("id", bookId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 400 });
  if (current.cover_path) await supabase.storage.from("book-covers").remove([current.cover_path]);
  return new NextResponse(null, { status: 204 });
}
