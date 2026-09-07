import { NextRequest, NextResponse } from "next/server";
import { bookInputSchema } from "@/lib/books/validation";
import { bookToDto, requireUser, resolveProviderCover, setBookStatus, storeCover, storeRemoteCover, toInsert } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
  if (!(cover instanceof File) || cover.size === 0) {
    const remoteCoverUrl = await resolveProviderCover(parsed.data);
    if (remoteCoverUrl) {
      try {
        storedCoverPath = await storeRemoteCover(supabase, userId, row.id, remoteCoverUrl);
        const { data: updated } = await supabase.from("library_books").update({ cover_path: storedCoverPath, cover_url: remoteCoverUrl }).eq("id", row.id).eq("user_id", userId).select().single();
        savedRow = updated ?? row;
      } catch {
        // Provider covers are optional. The persistent fallback keeps the book usable.
      }
    }
  } else {
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
