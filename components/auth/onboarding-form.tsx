"use client";

import { useEffect, useRef } from "react";
import { authCopy } from "@/lib/auth/copy";
import type { Locale } from "@/lib/shelf-seasons";

export function OnboardingForm({
  locale,
  initialTimezone,
  initialTheme,
}: {
  locale: Locale;
  initialTimezone: string;
  initialTheme: "system" | "light" | "dark";
}) {
  const c = authCopy[locale];
  const timezoneInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTimezone !== "UTC") return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && timezoneInput.current) timezoneInput.current.value = detected;
  }, [initialTimezone]);

  return (
    <form action="/api/onboarding" method="post" className="onboarding-form">
      <label>
        <span>{c.locale}</span>
        <select name="locale" defaultValue={locale}>
          <option value="en">English</option>
          <option value="ru">Русский</option>
        </select>
      </label>
      <input name="timezone" ref={timezoneInput} type="hidden" defaultValue={initialTimezone} />
      <label>
        <span>{c.theme}</span>
        <select name="theme" defaultValue={initialTheme}>
          <option value="system">{c.system}</option>
          <option value="light">{c.light}</option>
          <option value="dark">{c.dark}</option>
        </select>
      </label>
      <label>
        <span>{c.goal}</span>
        <input name="goal" type="number" min="1" max="999" inputMode="numeric" />
        <small>{c.goalHint}</small>
      </label>
      <button type="submit" className="onboarding-submit">{c.finish}</button>
    </form>
  );
}
