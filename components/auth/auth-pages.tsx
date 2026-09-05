import Link from "next/link";
import { BookOpen, CheckCircle2, Library, LockKeyhole } from "lucide-react";
import { authCopy } from "@/lib/auth/copy";
import type { Locale } from "@/lib/shelf-seasons";
import { OnboardingForm } from "./onboarding-form";

type SignInProps = {
  locale: Locale;
  configured: boolean;
  hasError?: boolean;
};

export function SignInPage({ locale, configured, hasError }: SignInProps) {
  const c = authCopy[locale];

  return (
    <main className="auth-page" lang={locale}>
      <section className="auth-story" aria-label={c.signInEyebrow}>
        <Link href={`/${locale}/app`} className="auth-brand">
          <span className="brand-mark" aria-hidden="true"><BookOpen /></span>
          <span>Shelf Seasons</span>
        </Link>
        <div className="auth-story-copy">
          <p className="eyebrow">{c.signInEyebrow}</p>
          <h1>{c.signInTitle}</h1>
          <p>{c.signInLead}</p>
          <div className="auth-benefits" aria-hidden="true">
            <span><Library /> 18 / 30</span>
            <span><CheckCircle2 /> 12</span>
            <span><LockKeyhole /></span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          {hasError && <p className="auth-error" role="alert">{c.authError}</p>}
          {configured ? (
            <>
              <form action="/auth/google" method="get">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="next" value={`/${locale}/app`} />
                <button type="submit" className="google-button">
                  <GoogleMark />
                  {c.google}
                </button>
              </form>
              <p className="auth-privacy"><LockKeyhole />{c.privacy}</p>
            </>
          ) : (
            <div className="setup-message">
              <h2>{c.setupTitle}</h2>
              <p>{c.setupLead}</p>
              <Link href={`/${locale}/app`} className="auth-demo-link">{c.openDemo}</Link>
            </div>
          )}
          <div className="auth-language">
            <Link href="/en/sign-in" aria-current={locale === "en" ? "page" : undefined}>EN</Link>
            <Link href="/ru/sign-in" aria-current={locale === "ru" ? "page" : undefined}>RU</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export function OnboardingPage({
  locale,
  initialTimezone,
  initialTheme,
  hasError,
}: {
  locale: Locale;
  initialTimezone: string;
  initialTheme: "system" | "light" | "dark";
  hasError?: boolean;
}) {
  const c = authCopy[locale];
  return (
    <main className="onboarding-page" lang={locale}>
      <Link href={`/${locale}/app`} className="auth-brand onboarding-brand">
        <span className="brand-mark" aria-hidden="true"><BookOpen /></span>
        <span>Shelf Seasons</span>
      </Link>
      <section className="onboarding-card">
        <p className="eyebrow">{c.onboardingEyebrow}</p>
        <h1>{c.onboardingTitle}</h1>
        <p className="onboarding-lead">{c.onboardingLead}</p>
        {hasError && <p className="auth-error" role="alert">{c.onboardingError}</p>}
        <OnboardingForm
          locale={locale}
          initialTimezone={initialTimezone}
          initialTheme={initialTheme}
        />
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.23-.2-1.77h-9.2v3.34h5.4a4.6 4.6 0 0 1-2 3.02v2.17h3.24c1.9-1.75 2.76-4.33 2.76-6.76Z" />
      <path fill="#34A853" d="M12.2 21.8c2.7 0 4.97-.9 6.63-2.43l-3.24-2.17c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.27v2.24a10 10 0 0 0 8.93 5.52Z" />
      <path fill="#FBBC05" d="M6.6 14.04a6 6 0 0 1 0-3.84V7.96H3.27a10 10 0 0 0 0 8.32l3.33-2.24Z" />
      <path fill="#EA4335" d="M12.2 6.08c1.47 0 2.78.5 3.82 1.5l2.88-2.8A9.65 9.65 0 0 0 12.2 2.2a10 10 0 0 0-8.93 5.76L6.6 10.2c.79-2.36 3-4.12 5.6-4.12Z" />
    </svg>
  );
}
