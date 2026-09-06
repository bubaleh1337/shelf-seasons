import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import type { YearlyGoal } from "@/lib/reading/types";
import { yearlyGoalInputSchema } from "@/lib/reading/validation";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const userId = await requireUser(supabase);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = yearlyGoalInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_goal" }, { status: 400 });

  const input = parsed.data;
  const { data: row, error } = await supabase.from("reading_goals").upsert({
    user_id: userId,
    year: input.year,
    target_books: input.targetBooks,
    include_rereads: input.includeRereads,
  }, { onConflict: "user_id,year" }).select("year,target_books,include_rereads").single();
  if (error || !row) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  const goal: YearlyGoal = { year: row.year, targetBooks: row.target_books, includeRereads: row.include_rereads };
  return NextResponse.json({ goal });
}
