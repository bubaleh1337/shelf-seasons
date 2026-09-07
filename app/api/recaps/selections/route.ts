import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/books/server";
import { periodBounds } from "@/lib/recaps/period";
import { recapSelectionSchema } from "@/lib/recaps/validation";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  const parsed = recapSelectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_selection" }, { status: 400 });

  try {
    const bounds = periodBounds(parsed.data.periodType, parsed.data.periodStart);
    const supabase = await createClient();
    const userId = await requireUser(supabase);
    if (!userId) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

    if (parsed.data.valueId === null) {
      const { error } = await supabase.from("recap_selections").delete().eq("user_id", userId).eq("period_type", parsed.data.periodType).eq("period_start", bounds.start).eq("category", parsed.data.category);
      if (error) throw error;
      return NextResponse.json({ category: parsed.data.category, valueId: null });
    }

    if (parsed.data.category === "favorite_series") {
      const { data: entries, error: entriesError } = await supabase.from("series_entries").select("book_id").eq("user_id", userId).eq("series_id", parsed.data.valueId).not("book_id", "is", null);
      if (entriesError) throw entriesError;
      const bookIds = (entries ?? []).flatMap((entry) => entry.book_id ? [entry.book_id] : []);
      if (!bookIds.length) return NextResponse.json({ error: "selection_not_eligible" }, { status: 400 });
      const { count, error } = await supabase.from("reading_runs").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed").in("book_id", bookIds).gte("finished_on", bounds.start).lt("finished_on", bounds.end);
      if (error) throw error;
      if (!count) return NextResponse.json({ error: "selection_not_eligible" }, { status: 400 });
    } else {
      const { data: run, error } = await supabase.from("reading_runs").select("id").eq("id", parsed.data.valueId).eq("user_id", userId).eq("status", "completed").gte("finished_on", bounds.start).lt("finished_on", bounds.end).maybeSingle();
      if (error) throw error;
      if (!run) return NextResponse.json({ error: "selection_not_eligible" }, { status: 400 });
    }

    const isSeries = parsed.data.category === "favorite_series";
    const { error } = await supabase.from("recap_selections").upsert({
      user_id: userId,
      period_type: parsed.data.periodType,
      period_start: bounds.start,
      category: parsed.data.category,
      run_id: isSeries ? null : parsed.data.valueId,
      series_id: isSeries ? parsed.data.valueId : null,
    }, { onConflict: "user_id,period_type,period_start,category" });
    if (error) throw error;
    return NextResponse.json({ category: parsed.data.category, valueId: parsed.data.valueId });
  } catch {
    return NextResponse.json({ error: "selection_unavailable" }, { status: 500 });
  }
}
