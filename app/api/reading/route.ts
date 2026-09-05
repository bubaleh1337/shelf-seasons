import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { readingInputSchema } from "@/lib/reading/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = readingInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_session" }, { status: 400 });
  const input = parsed.data;
  const { data: sessionId, error } = await supabase.rpc("log_reading_session", {
    p_book_id: input.bookId,
    p_read_on: input.readOn,
    p_check_in_only: input.checkInOnly,
    p_pages_read: input.pagesRead,
    p_minutes_read: input.minutesRead,
    p_resulting_percent: input.resultingPercent,
    p_note: input.note,
  });
  if (error || !sessionId) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({ sessionId, bookId: input.bookId }, { status: 201 });
}
