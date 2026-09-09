import { notFound, redirect } from "next/navigation";
import { OnboardingPage, SignInPage } from "@/components/auth/auth-pages";
import { OfflinePage, ShelfSeasonsDemo } from "@/components/shelf-seasons-demo";
import { ShelfSeasonsApp } from "@/components/shelf-seasons-app";
import { booksToDtos } from "@/lib/books/server";
import { localDateKey } from "@/lib/reading/dates";
import type { ReadingRun, ReadingSession, YearlyGoal } from "@/lib/reading/types";
import { seriesEntryToDto, seriesToDto } from "@/lib/series/server";
import type { BookSeries } from "@/lib/series/types";
import type { Locale } from "@/lib/shelf-seasons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string; slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LocalizedPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale, slug = [] } = await params;
  const query = await searchParams;

  if (rawLocale !== "en" && rawLocale !== "ru") {
    notFound();
  }

  const locale = rawLocale as Locale;

  if (slug.length === 0) {
    redirect(`/${locale}/app`);
  }

  if (slug[0] === "offline") {
    return <OfflinePage locale={locale} />;
  }

  if (slug[0] === "sign-in") {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getClaims();
      if (data?.claims?.sub) redirect(`/${locale}/app`);
    }

    return (
      <SignInPage
        locale={locale}
        configured={isSupabaseConfigured}
        hasError={typeof query.error === "string"}
        accountDeleted={query.deleted === "1"}
      />
    );
  }

  if (slug[0] === "onboarding") {
    if (!isSupabaseConfigured) redirect(`/${locale}/sign-in`);
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) redirect(`/${locale}/sign-in`);

    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone,theme,onboarding_completed_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (profile?.onboarding_completed_at) redirect(`/${locale}/app`);

    return (
      <OnboardingPage
        locale={locale}
        initialTimezone={profile?.timezone ?? "UTC"}
        initialTheme={profile?.theme ?? "system"}
        hasError={typeof query.error === "string"}
      />
    );
  }

  if (slug[0] !== "app") {
    notFound();
  }

  if (!isSupabaseConfigured) {
    return <ShelfSeasonsDemo locale={locale} section={slug[1] ?? "home"} />;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,locale,timezone,theme,onboarding_completed_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile?.onboarding_completed_at) redirect(`/${locale}/onboarding`);
  if (profile.locale !== locale) {
    const rest = slug.slice(1).join("/");
    redirect(`/${profile.locale}/app${rest ? `/${rest}` : ""}`);
  }

  const currentYear = Number(localDateKey(profile.timezone).slice(0, 4));
  const [{ data: rows }, { data: runs }, { data: nominations }, { data: sessionRows }, { data: goalRow }, { data: seriesRows }, { data: entryRows }] = await Promise.all([
    supabase.from("library_books").select().eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("reading_runs").select("id,book_id,status,started_on,finished_on,is_reread,current_position,total_units,rating,impression,reading_language").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("run_nominations").select("run_id,kind").eq("user_id", userId),
    supabase.from("reading_sessions").select("id,run_id,read_on,check_in_only,pages_read,minutes_read,resulting_percent,ending_page,note").eq("user_id", userId).order("read_on", { ascending: false }).limit(1000),
    supabase.from("reading_goals").select("year,target_books,include_rereads").eq("user_id", userId).eq("year", currentYear).maybeSingle(),
    supabase.from("series").select().eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("series_entries").select().eq("user_id", userId).order("sort_order"),
  ]);
  const initialBooks = await booksToDtos(supabase, rows ?? []);
  const nominationMap = new Map((nominations ?? []).map((item) => [item.run_id, item.kind]));
  const initialRuns: ReadingRun[] = (runs ?? []).map((run) => ({ id: run.id, bookId: run.book_id, status: run.status, startedOn: run.started_on, finishedOn: run.finished_on, isReread: run.is_reread, currentPosition: run.current_position, totalUnits: run.total_units, rating: run.rating === null ? null : Number(run.rating), impression: run.impression, nomination: nominationMap.get(run.id) ?? null, readingLanguage: run.reading_language }));
  const runBooks = new Map(initialRuns.map((run) => [run.id, run.bookId]));
  const initialSessions: ReadingSession[] = (sessionRows ?? []).flatMap((session) => {
    const bookId = runBooks.get(session.run_id);
    if (!bookId) return [];
    return [{ id: session.id, runId: session.run_id, bookId, readOn: session.read_on, checkInOnly: session.check_in_only, endingPage: session.ending_page, pagesRead: session.pages_read, minutesRead: session.minutes_read, resultingPercent: session.resulting_percent, note: session.note }];
  });

  const initialGoal: YearlyGoal | null = goalRow ? { year: goalRow.year, targetBooks: goalRow.target_books, includeRereads: goalRow.include_rereads } : null;
  const entriesBySeries = new Map<string, ReturnType<typeof seriesEntryToDto>[]>();
  for (const row of entryRows ?? []) {
    const entry = seriesEntryToDto(row);
    entriesBySeries.set(entry.seriesId, [...(entriesBySeries.get(entry.seriesId) ?? []), entry]);
  }
  const initialSeries: BookSeries[] = (seriesRows ?? []).map((row) => seriesToDto(row, entriesBySeries.get(row.id)));

  return <ShelfSeasonsApp locale={locale} section={slug[1] ?? "home"} readerName={profile.display_name ?? undefined} timezone={profile.timezone} initialTheme={profile.theme} initialBooks={initialBooks} initialSessions={initialSessions} initialRuns={initialRuns} initialGoal={initialGoal} initialSeries={initialSeries} />;
}
