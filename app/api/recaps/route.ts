import { NextRequest, NextResponse } from "next/server";
import { booksToDtos, requireUser } from "@/lib/books/server";
import { currentPeriodStart, periodBounds, recapGoalProgress, recapSeriesCandidates, summarizeRecapMetrics, uniqueRecapBooks } from "@/lib/recaps/period";
import type { RecapBookCandidate, RecapBookChoice, RecapSelections, RecapSummary } from "@/lib/recaps/types";
import { recapPeriodSchema } from "@/lib/recaps/validation";
import { localDateKey } from "@/lib/reading/dates";
import type { ReadingRun, ReadingSession, YearlyGoal } from "@/lib/reading/types";
import { seriesEntryToDto, seriesToDto } from "@/lib/series/server";
import type { BookSeries } from "@/lib/series/types";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const parsed = recapPeriodSchema.safeParse({
    periodType: request.nextUrl.searchParams.get("periodType"),
    periodStart: request.nextUrl.searchParams.get("periodStart"),
  });
  if (!parsed.success) return NextResponse.json({ error: "invalid_period" }, { status: 400 });

  try {
    const bounds = periodBounds(parsed.data.periodType, parsed.data.periodStart);
    const supabase = await createClient();
    const userId = await requireUser(supabase);
    if (!userId) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("timezone").eq("user_id", userId).single();
    const today = localDateKey(profile?.timezone ?? "UTC");
    if (bounds.start > currentPeriodStart(parsed.data.periodType, today)) {
      return NextResponse.json({ error: "future_period" }, { status: 400 });
    }

    const [{ data: runRows, error: runsError }, { data: sessionRows, error: sessionsError }, { data: seriesRows, error: seriesError }, { data: entryRows, error: entriesError }, { data: selectionRows, error: selectionsError }, { data: choiceRows, error: choicesError }] = await Promise.all([
      supabase.from("reading_runs").select("id,book_id,status,started_on,finished_on,is_reread,current_position,total_units,rating,reading_language").eq("user_id", userId).eq("status", "completed").gte("finished_on", bounds.start).lt("finished_on", bounds.end).order("finished_on", { ascending: false }),
      supabase.from("reading_sessions").select("id,run_id,read_on,check_in_only,pages_read,minutes_read,resulting_percent,ending_page").eq("user_id", userId).gte("read_on", bounds.start).lt("read_on", bounds.end).order("read_on"),
      supabase.from("series").select().eq("user_id", userId).order("name"),
      supabase.from("series_entries").select().eq("user_id", userId).order("sort_order"),
      supabase.from("recap_selections").select("category,book_id,run_id,series_id").eq("user_id", userId).eq("period_type", parsed.data.periodType).eq("period_start", bounds.start),
      supabase.from("library_books").select("id,title,authors").eq("user_id", userId).order("title"),
    ]);
    if (runsError || sessionsError || seriesError || entriesError || selectionsError || choicesError) throw runsError ?? sessionsError ?? seriesError ?? entriesError ?? selectionsError ?? choicesError;

    const runIds = (runRows ?? []).map((run) => run.id);
    const bookIds = [...new Set((runRows ?? []).map((run) => run.book_id))];
    const [{ data: nominationRows, error: nominationError }, { data: bookRows, error: booksError }] = await Promise.all([
      runIds.length ? supabase.from("run_nominations").select("run_id,kind").eq("user_id", userId).in("run_id", runIds) : Promise.resolve({ data: [], error: null }),
      bookIds.length ? supabase.from("library_books").select().eq("user_id", userId).in("id", bookIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (nominationError || booksError) throw nominationError ?? booksError;

    const books = await booksToDtos(supabase, bookRows ?? []);
    const selectionBooks: RecapBookChoice[] = (choiceRows ?? []).map((book) => ({ id: book.id, title: book.title, authors: book.authors }));
    const bookMap = new Map(books.map((book) => [book.id, book]));
    const nominationMap = new Map((nominationRows ?? []).map((item) => [item.run_id, item.kind]));
    const runs: ReadingRun[] = (runRows ?? []).map((run) => ({
      id: run.id, bookId: run.book_id, status: run.status, startedOn: run.started_on, finishedOn: run.finished_on,
      isReread: run.is_reread, currentPosition: run.current_position, totalUnits: run.total_units,
      rating: run.rating === null ? null : Number(run.rating), impression: null, nomination: nominationMap.get(run.id) ?? null, readingLanguage: run.reading_language,
    }));
    const runBookMap = new Map(runs.map((run) => [run.id, run.bookId]));
    const sessions: ReadingSession[] = (sessionRows ?? []).flatMap((session) => {
      const bookId = runBookMap.get(session.run_id) ?? "";
      return [{ id: session.id, runId: session.run_id, bookId, readOn: session.read_on, checkInOnly: session.check_in_only, endingPage: session.ending_page, pagesRead: session.pages_read, minutesRead: session.minutes_read, resultingPercent: session.resulting_percent, note: null }];
    });
    const entriesBySeries = new Map<string, ReturnType<typeof seriesEntryToDto>[]>();
    for (const row of entryRows ?? []) {
      const entry = seriesEntryToDto(row);
      entriesBySeries.set(entry.seriesId, [...(entriesBySeries.get(entry.seriesId) ?? []), entry]);
    }
    const series: BookSeries[] = (seriesRows ?? []).map((row) => seriesToDto(row, entriesBySeries.get(row.id)));
    const candidates: RecapBookCandidate[] = runs.flatMap((run) => {
      const book = bookMap.get(run.bookId);
      return book && run.finishedOn ? [{ runId: run.id, book, finishedOn: run.finishedOn, isReread: run.isReread, rating: run.rating, nomination: run.nomination }] : [];
    });
    const uniqueCandidates = uniqueRecapBooks(candidates);
    const uniqueRuns = uniqueCandidates.map((candidate) => runs.find((run) => run.id === candidate.runId)).filter((run): run is ReadingRun => Boolean(run));
    const selections: RecapSelections = Object.fromEntries((selectionRows ?? []).map((selection) => [selection.category, selection.book_id ?? selection.run_id ?? selection.series_id]));
    let goal: YearlyGoal | null = null;
    if (parsed.data.periodType === "year") {
      const year = Number(bounds.start.slice(0, 4));
      const { data: goalRow, error: goalError } = await supabase.from("reading_goals").select("year,target_books,include_rereads").eq("user_id", userId).eq("year", year).maybeSingle();
      if (goalError) throw goalError;
      goal = goalRow ? { year: goalRow.year, targetBooks: goalRow.target_books, includeRereads: goalRow.include_rereads } : null;
    }
    const metrics = summarizeRecapMetrics(sessions);
    const summary: RecapSummary = {
      periodType: parsed.data.periodType, periodStart: bounds.start, periodEnd: bounds.end, isFinal: bounds.end <= today,
      completedCount: uniqueCandidates.length, uniqueBooks: uniqueCandidates.length,
      rereads: runs.filter((run) => run.isReread).length, ...metrics,
      goal: recapGoalProgress(runs, goal), books: uniqueCandidates, selectionBooks,
      series: recapSeriesCandidates(series, runs.map((run) => run.bookId)), selections,
      languageCounts: {
        ru: uniqueRuns.filter((run) => run.readingLanguage === "ru").length,
        en: uniqueRuns.filter((run) => run.readingLanguage === "en").length,
        other: uniqueRuns.filter((run) => run.readingLanguage === "other").length,
      },
    };
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "recap_unavailable" }, { status: 500 });
  }
}
