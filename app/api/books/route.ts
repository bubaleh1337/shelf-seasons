import { NextRequest, NextResponse } from "next/server";
import { bookInputSchema } from "@/lib/books/validation";
import { bookToDto, isBookFormTooLarge, requireUser, setBookStatus, storeCover, toInsert } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  if (isBookFormTooLarge(request)) return NextResponse.json({ error: "cover_too_large" }, { status: 413 });
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
  const values = toInsert(userId, parsed.data);
  const desiredStatus = values.status ?? "want";
  const { data: row, error } = await supabase.from("library_books").insert({ ...values, status: "want" }).select().single();
  if (error || !row) return NextResponse.json({ error: "save_failed" }, { status: 400 });

  const cover = form.get("cover");
  let savedRow = row;
  let storedCoverPath: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    try {
      storedCoverPath = await storeCover(supabase, userId, row.id, cover);
      const { data: updated, error: updateError } = await supabase.from("library_books").update({ cover_path: storedCoverPath }).eq("id", row.id).eq("user_id", userId).select().single();
      if (updateError || !updated) throw updateError ?? new Error("cover_update_failed");
      savedRow = updated;
    } catch {
      await supabase.from("library_books").delete().eq("id", row.id).eq("user_id", userId);
      return NextResponse.json({ error: "cover_failed" }, { status: 400 });
    }
  }

  try {
    savedRow = await setBookStatus(supabase, row.id, desiredStatus);
  } catch {
    await supabase.from("library_books").delete().eq("id", row.id).eq("user_id", userId);
    if (storedCoverPath) await supabase.storage.from("book-covers").remove([storedCoverPath]);
    return NextResponse.json({ error: "status_sync_failed" }, { status: 400 });
  }

  return NextResponse.json({ book: await bookToDto(supabase, savedRow) }, { status: 201 });
}
