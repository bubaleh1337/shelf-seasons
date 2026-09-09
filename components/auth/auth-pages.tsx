import Link from "next/link";
import { BookOpen, CheckCircle2, Library, LockKeyhole } from "lucide-react";
import { authCopy } from "@/lib/auth/copy";
import type { Locale } from "@/lib/shelf-seasons";
import { GoogleSignInButton } from "./google-sign-in-button";
import { OnboardingForm } from "./onboarding-form";

type SignInProps = {
  locale: Locale;
  configured: boolean;
  hasError?: boolean;
  accountDeleted?: boolean;
};

export function SignInPage({ locale, configured, hasError, accountDeleted }: SignInProps) {
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
          {accountDeleted && <p className="auth-success" role="status"><CheckCircle2 />{c.accountDeleted}</p>}
          {hasError && <p className="auth-error" role="alert">{c.authError}</p>}
          {configured ? (
            <>
              <GoogleSignInButton
                locale={locale}
                label={c.google}
                pendingLabel={c.googlePending}
                errorLabel={c.authError}
              />
              <p className="auth-privacy"><LockKeyhole />{c.privacy}</p>
              <nav className="auth-legal" aria-label={c.privacy}>
                <Link href={`/${locale}/privacy`}>{c.privacyPolicy}</Link>
                <Link href={`/${locale}/terms`}>{c.termsOfUse}</Link>
              </nav>
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
