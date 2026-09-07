import { NextResponse } from "next/server";
import { accountExportFilename, buildAccountExport } from "@/lib/account/export";
import { requireUser } from "@/lib/books/server";
import { createClient } from "@/lib/supabase/server";
const PAGE_SIZE = 500;
async function collectPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) { const rows: T[] = []; for (let from = 0; ; from += PAGE_SIZE) { const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1); if (error) throw error; const page = data ?? []; rows.push(...page); if (page.length < PAGE_SIZE) return rows; } }
export async function GET() {
  const supabase = await createClient(); const userId = await requireUser(supabase); if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { data: userData } = await supabase.auth.getUser(); const { data: profile, error: profileError } = await supabase.from("profiles").select().eq("user_id", userId).maybeSingle(); if (profileError) throw profileError;
    const [libraryBooks, readingRuns, readingSessions, readingGoals, runNominations, series, seriesEntries, recapSelections] = await Promise.all([
      collectPages((from, to) => supabase.from("library_books").select().eq("user_id", userId).order("created_at").range(from, to)), collectPages((from, to) => supabase.from("reading_runs").select().eq("user_id", userId).order("created_at").range(from, to)), collectPages((from, to) => supabase.from("reading_sessions").select().eq("user_id", userId).order("created_at").range(from, to)), collectPages((from, to) => supabase.from("reading_goals").select().eq("user_id", userId).order("year").range(from, to)), collectPages((from, to) => supabase.from("run_nominations").select().eq("user_id", userId).order("created_at").range(from, to)), collectPages((from, to) => supabase.from("series").select().eq("user_id", userId).order("created_at").range(from, to)), collectPages((from, to) => supabase.from("series_entries").select().eq("user_id", userId).order("created_at").range(from, to)), collectPages((from, to) => supabase.from("recap_selections").select().eq("user_id", userId).order("created_at").range(from, to)),
    ]);
    const body = buildAccountExport({ id: userId, email: userData.user?.email }, { profile, libraryBooks, readingRuns, readingSessions, readingGoals, runNominations, series, seriesEntries, recapSelections });
    return new NextResponse(JSON.stringify(body, null, 2), { headers: { "cache-control": "no-store", "content-disposition": `attachment; filename="${accountExportFilename()}"`, "content-type": "application/json; charset=utf-8" } });
  } catch { return NextResponse.json({ error: "export_failed" }, { status: 500 }); }
}
