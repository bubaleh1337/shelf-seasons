import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { seriesToDto } from "@/lib/series/server";
import { seriesInputSchema } from "@/lib/series/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = seriesInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_series" }, { status: 400 });

  const input = parsed.data;
  const { data: row, error } = await supabase.from("series").insert({
    user_id: userId,
    name: input.name,
    creator: input.creator,
    description: input.description,
    status: input.status,
    cover_book_id: input.coverBookId,
  }).select().single();
  if (error || !row) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({ series: seriesToDto(row) }, { status: 201 });
}
