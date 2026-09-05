import { notFound, redirect } from "next/navigation";
import { OnboardingPage, SignInPage } from "@/components/auth/auth-pages";
import { OfflinePage, ShelfSeasonsDemo } from "@/components/shelf-seasons-demo";
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
    .select("display_name,locale,onboarding_completed_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile?.onboarding_completed_at) redirect(`/${locale}/onboarding`);
  if (profile.locale !== locale) {
    const rest = slug.slice(1).join("/");
    redirect(`/${profile.locale}/app${rest ? `/${rest}` : ""}`);
  }

  return (
    <ShelfSeasonsDemo
      locale={locale}
      section={slug[1] ?? "home"}
      authEnabled
      readerName={profile.display_name ?? undefined}
    />
  );
}
