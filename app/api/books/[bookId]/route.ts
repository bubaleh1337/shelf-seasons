import { NextRequest, NextResponse } from "next/server";
import { bookInputSchema } from "@/lib/books/validation";
import { bookToDto, isBookFormTooLarge, requireUser, setBookStatus, storeCover, toInsert } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimitResponse } from "@/lib/security/rate-limit";

type Context = { params: Promise<{ bookId: string }> };

const statusInputSchema = z.object({ status: z.enum(["want", "reading", "read", "paused", "dnf"]) });

export async function PATCH(request: NextRequest, context: Context) {
  const { bookId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = statusInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  const { data: current } = await supabase.from("library_books").select("id").eq("id", bookId).eq("user_id", userId).maybeSingle();
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const row = await setBookStatus(supabase, bookId, parsed.data.status);
    return NextResponse.json({ book: await bookToDto(supabase, row) });
  } catch {
    return NextResponse.json({ error: "status_sync_failed" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  if (isBookFormTooLarge(request)) return NextResponse.json({ error: "cover_too_large" }, { status: 413 });
  const { bookId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limited = await rateLimitResponse(supabase, "book-write", 30, 300, {
    continueOnInfrastructureError: true,
  });
  if (limited) return limited;
  const form = await request.formData();
  const parsed = bookInputSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.json({ error: "invalid_book" }, { status: 400 });
  const { data: current } = await supabase.from("library_books").select().eq("id", bookId).eq("user_id", userId).maybeSingle();
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const previousCoverPath = current.cover_path;
  let coverPath = parsed.data.removeCover ? null : previousCoverPath;
  const cover = form.get("cover");
  try {
    if (cover instanceof File && cover.size > 0) coverPath = await storeCover(supabase, userId, bookId, cover);
  } catch {
    return NextResponse.json({ error: "cover_failed" }, { status: 400 });
  }

  const values = toInsert(userId, parsed.data);
  const { status, ...metadata } = values;
  metadata.source = current.source;
  metadata.provider_id = current.provider_id;
  const { error } = await supabase.from("library_books").update({ ...metadata, cover_path: coverPath }).eq("id", bookId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  if (parsed.data.removeCover && previousCoverPath && coverPath !== previousCoverPath) {
    await supabase.storage.from("book-covers").remove([previousCoverPath]);
  }
  let updated;
  if ((status ?? "want") === current.status) {
    const { data: unchangedStatusRow, error: reloadError } = await supabase.from("library_books").select().eq("id", bookId).eq("user_id", userId).single();
    if (reloadError || !unchangedStatusRow) return NextResponse.json({ error: "save_failed" }, { status: 400 });
    updated = unchangedStatusRow;
  } else {
    try {
      updated = await setBookStatus(supabase, bookId, status ?? "want");
    } catch {
      return NextResponse.json({ error: "status_sync_failed" }, { status: 400 });
    }
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
