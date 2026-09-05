import { AuthCompleteClient } from "@/components/auth/auth-complete-client";
import { parseLocale } from "@/lib/auth/redirect";

type CompletePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthCompletePage({
  searchParams,
}: CompletePageProps) {
  const params = await searchParams;
  const rawLocale = Array.isArray(params.locale)
    ? params.locale[0]
    : params.locale;
  return <AuthCompleteClient locale={parseLocale(rawLocale)} />;
}
