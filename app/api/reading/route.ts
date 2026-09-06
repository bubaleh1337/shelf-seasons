import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { readingInputSchema } from "@/lib/reading/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [{ data: rows }, { data: nominations }] = await Promise.all([
    supabase.from("reading_runs").select("id,book_id,status,started_on,finished_on,is_reread,current_position,total_units,rating,impression").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("run_nominations").select("run_id,kind").eq("user_id", userId),
  ]);
  const nominationMap = new Map((nominations ?? []).map((item) => [item.run_id, item.kind]));
  return NextResponse.json({ runs: (rows ?? []).map((row) => ({
    id: row.id,
    bookId: row.book_id,
    status: row.status,
    startedOn: row.started_on,
    finishedOn: row.finished_on,
    isReread: row.is_reread,
    currentPosition: row.current_position,
    totalUnits: row.total_units,
    rating: row.rating === null ? null : Number(row.rating),
    impression: row.impression,
    nomination: nominationMap.get(row.id) ?? null,
  })) });
}

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
  const { data: session } = await supabase.from("reading_sessions").select("run_id").eq("id", sessionId).eq("user_id", userId).single();
  if (!session) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({ sessionId, runId: session.run_id, bookId: input.bookId }, { status: 201 });
}
