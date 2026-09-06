import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { seriesEntryToDto, seriesToDto } from "@/lib/series/server";
import { seriesInputSchema } from "@/lib/series/validation";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ seriesId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  const { seriesId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = seriesInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_series" }, { status: 400 });
  const input = parsed.data;
  const { data: row, error } = await supabase.from("series").update({ name: input.name, creator: input.creator, description: input.description, status: input.status, cover_book_id: input.coverBookId }).eq("id", seriesId).eq("user_id", userId).select().single();
  if (error || !row) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  const { data: entries } = await supabase.from("series_entries").select().eq("series_id", seriesId).eq("user_id", userId).order("sort_order");
  return NextResponse.json({ series: seriesToDto(row, (entries ?? []).map(seriesEntryToDto)) });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const { seriesId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("series").delete().eq("id", seriesId).eq("user_id", userId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 400 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
