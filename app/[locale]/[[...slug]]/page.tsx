import { notFound, redirect } from "next/navigation";
import { OnboardingPage, SignInPage } from "@/components/auth/auth-pages";
import { OfflinePage, ShelfSeasonsDemo } from "@/components/shelf-seasons-demo";
import { ShelfSeasonsApp } from "@/components/shelf-seasons-app";
import { bookToDto } from "@/lib/books/server";
import type { ReadingSession } from "@/lib/reading/types";
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

  const { data: rows } = await supabase
    .from("library_books")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const initialBooks = await Promise.all((rows ?? []).map((row) => bookToDto(supabase, row)));
  const { data: runs } = await supabase.from("reading_runs").select("id,book_id").eq("user_id", userId);
  const runBooks = new Map((runs ?? []).map((run) => [run.id, run.book_id]));
  const { data: sessionRows } = await supabase.from("reading_sessions").select("id,run_id,read_on,check_in_only,pages_read,minutes_read,resulting_percent,note").eq("user_id", userId).order("read_on", { ascending: false }).limit(1000);
  const initialSessions: ReadingSession[] = (sessionRows ?? []).flatMap((session) => {
    const bookId = runBooks.get(session.run_id);
    if (!bookId) return [];
    return [{ id: session.id, runId: session.run_id, bookId, readOn: session.read_on, checkInOnly: session.check_in_only, pagesRead: session.pages_read, minutesRead: session.minutes_read, resultingPercent: session.resulting_percent, note: session.note }];
  });

  return <ShelfSeasonsApp locale={locale} section={slug[1] ?? "home"} readerName={profile.display_name ?? undefined} timezone={profile.timezone} initialTheme={profile.theme} initialBooks={initialBooks} initialSessions={initialSessions} />;
}
