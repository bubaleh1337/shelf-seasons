import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { seriesEntryToDto } from "@/lib/series/server";
import { seriesEntryInputSchema } from "@/lib/series/validation";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ seriesId: string; entryId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const { seriesId, entryId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = seriesEntryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_entry" }, { status: 400 });
  const input = parsed.data;
  const { data: row, error } = await supabase.from("series_entries").update({ book_id: input.bookId, placeholder_title: input.placeholderTitle, position_label: input.positionLabel }).eq("id", entryId).eq("series_id", seriesId).eq("user_id", userId).select().single();
  if (error || !row) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({ entry: seriesEntryToDto(row) });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { seriesId, entryId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("series_entries").delete().eq("id", entryId).eq("series_id", seriesId).eq("user_id", userId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 400 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
