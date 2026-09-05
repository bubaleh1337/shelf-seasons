import { AuthCallbackClient } from "@/components/auth/auth-callback-client";
import { parseLocale } from "@/lib/auth/redirect";

type CallbackPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthCallbackPage({
  searchParams,
}: CallbackPageProps) {
  const params = await searchParams;
  const rawLocale = Array.isArray(params.locale)
    ? params.locale[0]
    : params.locale;
  return <AuthCallbackClient locale={parseLocale(rawLocale)} />;
}
