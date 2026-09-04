import { notFound, redirect } from "next/navigation";
import { OfflinePage, ShelfSeasonsDemo } from "@/components/shelf-seasons-demo";
import type { Locale } from "@/lib/shelf-seasons";

type PageProps = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

export default async function LocalizedPage({ params }: PageProps) {
  const { locale: rawLocale, slug = [] } = await params;

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

  if (slug[0] !== "app") {
    notFound();
  }

  return <ShelfSeasonsDemo locale={locale} section={slug[1] ?? "home"} />;
}
