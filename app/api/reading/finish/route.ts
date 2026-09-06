import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { finishReadingInputSchema } from "@/lib/reading/validation";
import type { ReadingRun } from "@/lib/reading/types";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = finishReadingInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_completion" }, { status: 400 });

  const input = parsed.data;
  const { data: runId, error } = await supabase.rpc("finish_reading_run", {
    p_book_id: input.bookId,
    p_finished_on: input.finishedOn,
    p_rating: input.rating,
    p_impression: input.impression,
    p_nomination: input.nomination,
  });
  if (error || !runId) return NextResponse.json({ error: "finish_failed" }, { status: 400 });

  const [{ data: row }, { data: nomination }] = await Promise.all([
    supabase.from("reading_runs").select("id,book_id,status,started_on,finished_on,is_reread,current_position,total_units,rating,impression").eq("id", runId).eq("user_id", userId).single(),
    supabase.from("run_nominations").select("kind").eq("run_id", runId).eq("user_id", userId).maybeSingle(),
  ]);
  if (!row) return NextResponse.json({ error: "finish_failed" }, { status: 400 });

  const run: ReadingRun = {
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
    nomination: nomination?.kind ?? null,
  };
  return NextResponse.json({ run });
}
