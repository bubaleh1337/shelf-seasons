import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { seriesEntryToDto } from "@/lib/series/server";
import { seriesEntryInputSchema, seriesOrderInputSchema } from "@/lib/series/validation";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ seriesId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { seriesId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = seriesEntryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_entry" }, { status: 400 });
  const { data: ownedSeries } = await supabase.from("series").select("id").eq("id", seriesId).eq("user_id", userId).maybeSingle();
  if (!ownedSeries) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { data: last } = await supabase.from("series_entries").select("sort_order").eq("series_id", seriesId).eq("user_id", userId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const input = parsed.data;
  const { data: row, error } = await supabase.from("series_entries").insert({ user_id: userId, series_id: seriesId, book_id: input.bookId, placeholder_title: input.placeholderTitle, position_label: input.positionLabel, sort_order: (last ? Number(last.sort_order) : 0) + 1000 }).select().single();
  if (error || !row) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({ entry: seriesEntryToDto(row) }, { status: 201 });
}

export async function PUT(request: NextRequest, context: Context) {
  const { seriesId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = seriesOrderInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_order" }, { status: 400 });
  const { error } = await supabase.rpc("reorder_series_entries", { p_series_id: seriesId, p_entry_ids: parsed.data.entryIds });
  if (error) return NextResponse.json({ error: "reorder_failed" }, { status: 400 });
  const { data: rows } = await supabase.from("series_entries").select().eq("series_id", seriesId).eq("user_id", userId).order("sort_order");
  return NextResponse.json({ entries: (rows ?? []).map(seriesEntryToDto) });
}
