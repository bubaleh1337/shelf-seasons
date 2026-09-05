"use client";

import { useEffect, useState } from "react";
import { BookOpen, LoaderCircle } from "lucide-react";
import { authCopy } from "@/lib/auth/copy";
import { parseLocale, safeAppPath } from "@/lib/auth/redirect";
import type { Locale } from "@/lib/shelf-seasons";
import { createClient } from "@/lib/supabase/client";

export function AuthCallbackClient({ locale }: { locale: Locale }) {
  const [failed, setFailed] = useState(false);
  const copy = authCopy[locale];

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const callbackLocale = parseLocale(params.get("locale"));
    const next = safeAppPath(params.get("next"), callbackLocale);
    const signInUrl = new URL(`/${callbackLocale}/sign-in`, window.location.origin);

    async function finishSignIn() {
      const code = params.get("code");
      if (params.get("error") || !code) {
        signInUrl.searchParams.set("error", "invalid_callback");
        window.location.replace(signInUrl.toString());
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        if (active) setFailed(true);
        signInUrl.searchParams.set("error", "code_exchange_failed");
        window.location.replace(signInUrl.toString());
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("locale,onboarding_completed_at")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (!active) return;

      const profileLocale = parseLocale(profile?.locale ?? callbackLocale);
      const destination = profile?.onboarding_completed_at
        ? next
        : `/${profileLocale}/onboarding`;
      window.location.replace(new URL(destination, window.location.origin));
    }

    void finishSignIn();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="auth-callback-page" lang={locale}>
      <section className="auth-callback-card" aria-live="polite">
        <span className="brand-mark" aria-hidden="true">
          <BookOpen />
        </span>
        <h1>{failed ? copy.callbackErrorTitle : copy.callbackTitle}</h1>
        <p>{failed ? copy.authError : copy.callbackLead}</p>
        {!failed && <LoaderCircle className="spin" aria-hidden="true" />}
      </section>
    </main>
  );
}
