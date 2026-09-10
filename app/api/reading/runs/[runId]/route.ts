import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ runId: string }> };

export async function DELETE(_request: NextRequest, context: Context) {
  const { runId } = await context.params;
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: run, error: runError } = await supabase
    .from("reading_runs")
    .select("id,book_id,status,is_reread")
    .eq("id", runId)
    .eq("user_id", userId)
    .maybeSingle();
  if (runError || !run) return NextResponse.json({ error: "run_not_found" }, { status: 404 });
  if (run.status !== "completed" || !run.is_reread) {
    return NextResponse.json({ error: "only_reread_can_be_removed" }, { status: 409 });
  }

  const { count, error: countError } = await supabase
    .from("reading_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("book_id", run.book_id)
    .eq("status", "completed");
  if (countError || count === null || count < 2) {
    return NextResponse.json({ error: "last_completion_cannot_be_removed" }, { status: 409 });
  }

  const { error } = await supabase
    .from("reading_runs")
    .delete()
    .eq("id", runId)
    .eq("user_id", userId)
    .eq("is_reread", true);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
